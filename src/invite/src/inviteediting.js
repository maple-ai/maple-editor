/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module invite/inviteediting
 */

import { Plugin } from 'ckeditor5/src/core';
import { MouseObserver } from 'ckeditor5/src/engine';
import { Input, TwoStepCaretMovement, inlineHighlight, findAttributeRange } from 'ckeditor5/src/typing';
import { ClipboardPipeline } from 'ckeditor5/src/clipboard';
import { keyCodes, env } from 'ckeditor5/src/utils';

import InviteCommand from './invitecommand';
import UninviteCommand from './uninvitecommand';
import ManualDecorator from './utils/manualdecorator';
import { createInviteElement, ensureSafeUrl, getLocalizedDecorators, normalizeDecorators, openInvite } from './utils';

import '../theme/invite.css';

const HIGHLIGHT_CLASS = 'ck-invite_selected';
const DECORATOR_AUTOMATIC = 'automatic';
const DECORATOR_MANUAL = 'manual';
const EXTERNAL_LINKS_REGEXP = /^(https?:)?\/\//;

/**
 * The invite engine feature.
 *
 * It introduces the `inviteHref="url"` attribute in the model which renders to the view as a `<a href="url">` element
 * as well as `'invite'` and `'uninvite'` commands.
 *
 * @extends module:core/plugin~Plugin
 */
export default class InviteEditing extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'InviteEditing';
	}

	/**
	 * @inheritDoc
	 */
	static get requires() {
		// Clipboard is required for handling cut and paste events while typing over the invite.
		return [ TwoStepCaretMovement, Input, ClipboardPipeline ];
	}

	/**
	 * @inheritDoc
	 */
	constructor( editor ) {
		super( editor );

		editor.config.define( 'invite', {
			addTargetToExternalInvites: false
		} );
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;

		// Allow invite attribute on all inline nodes.
		editor.model.schema.extend( '$text', { allowAttributes: 'inviteHref' } );

		editor.conversion.for( 'dataDowncast' )
			.attributeToElement( { model: 'inviteHref', view: createInviteElement } );

		editor.conversion.for( 'editingDowncast' )
			.attributeToElement( { model: 'inviteHref', view: ( href, conversionApi ) => {
				return createInviteElement( ensureSafeUrl( href ), conversionApi );
			} } );

		editor.conversion.for( 'upcast' )
			.elementToAttribute( {
				view: {
					name: 'a',
					attributes: {
						href: true
					}
				},
				model: {
					key: 'inviteHref',
					value: viewElement => viewElement.getAttribute( 'href' )
				}
			} );

		// Create inviteing commands.
		editor.commands.add( 'invite', new InviteCommand( editor ) );
		editor.commands.add( 'uninvite', new UninviteCommand( editor ) );

		const inviteDecorators = getLocalizedDecorators( editor.t, normalizeDecorators( editor.config.get( 'invite.decorators' ) ) );

		this._enableAutomaticDecorators( inviteDecorators.filter( item => item.mode === DECORATOR_AUTOMATIC ) );
		this._enableManualDecorators( inviteDecorators.filter( item => item.mode === DECORATOR_MANUAL ) );

		// Enable two-step caret movement for `inviteHref` attribute.
		const twoStepCaretMovementPlugin = editor.plugins.get( TwoStepCaretMovement );
		twoStepCaretMovementPlugin.registerAttribute( 'inviteHref' );

		// Setup highlight over selected invite.
		inlineHighlight( editor, 'inviteHref', 'a', HIGHLIGHT_CLASS );

		// Handle invite following by CTRL+click or ALT+ENTER
		this._enableInviteOpen();

		// Change the attributes of the selection in certain situations after the invite was inserted into the document.
		this._enableInsertContentSelectionAttributesFixer();

		// Handle a click at the beginning/end of a invite element.
		this._enableClickingAfterInvite();

		// Handle typing over the invite.
		this._enableTypingOverInvite();

		// Handle removing the content after the invite element.
		this._handleDeleteContentAfterInvite();
	}

	/**
	 * Processes an array of configured {@invite module:invite/invite~InviteDecoratorAutomaticDefinition automatic decorators}
	 * and registers a {@invite module:engine/conversion/downcastdispatcher~DowncastDispatcher downcast dispatcher}
	 * for each one of them. Downcast dispatchers are obtained using the
	 * {@invite module:invite/utils~AutomaticDecorators#getDispatcher} method.
	 *
	 * **Note**: This method also activates the automatic external invite decorator if enabled with
	 * {@invite module:invite/invite~InviteConfig#addTargetToExternalInvites `config.invite.addTargetToExternalInvites`}.
	 *
	 * @private
	 * @param {Array.<module:invite/invite~InviteDecoratorAutomaticDefinition>} automaticDecoratorDefinitions
	 */
	_enableAutomaticDecorators( automaticDecoratorDefinitions ) {
		const editor = this.editor;
		// Store automatic decorators in the command instance as we do the same with manual decorators.
		// Thanks to that, `InviteImageEditing` plugin can re-use the same definitions.
		const command = editor.commands.get( 'invite' );
		const automaticDecorators = command.automaticDecorators;

		// Adds a default decorator for external invites.
		if ( editor.config.get( 'invite.addTargetToExternalInvites' ) ) {
			automaticDecorators.add( {
				id: 'inviteIsExternal',
				mode: DECORATOR_AUTOMATIC,
				callback: url => EXTERNAL_LINKS_REGEXP.test( url ),
				attributes: {
					target: '_blank',
					rel: 'noopener noreferrer'
				}
			} );
		}

		automaticDecorators.add( automaticDecoratorDefinitions );

		if ( automaticDecorators.length ) {
			editor.conversion.for( 'downcast' ).add( automaticDecorators.getDispatcher() );
		}
	}

	/**
	 * Processes an array of configured {@invite module:invite/invite~InviteDecoratorManualDefinition manual decorators},
	 * transforms them into {@invite module:invite/utils~ManualDecorator} instances and stores them in the
	 * {@invite module:invite/invitecommand~InviteCommand#manualDecorators} collection (a model for manual decorators state).
	 *
	 * Also registers an {@invite module:engine/conversion/downcasthelpers~DowncastHelpers#attributeToElement attribute-to-element}
	 * converter for each manual decorator and extends the {@invite module:engine/model/schema~Schema model's schema}
	 * with adequate model attributes.
	 *
	 * @private
	 * @param {Array.<module:invite/invite~InviteDecoratorManualDefinition>} manualDecoratorDefinitions
	 */
	_enableManualDecorators( manualDecoratorDefinitions ) {
		if ( !manualDecoratorDefinitions.length ) {
			return;
		}

		const editor = this.editor;
		const command = editor.commands.get( 'invite' );
		const manualDecorators = command.manualDecorators;

		manualDecoratorDefinitions.forEach( decorator => {
			editor.model.schema.extend( '$text', { allowAttributes: decorator.id } );

			// Keeps reference to manual decorator to decode its name to attributes during downcast.
			decorator = new ManualDecorator( decorator );

			manualDecorators.add( decorator );

			editor.conversion.for( 'downcast' ).attributeToElement( {
				model: decorator.id,
				view: ( manualDecoratorName, { writer } ) => {
					if ( manualDecoratorName ) {
						const element = writer.createAttributeElement( 'a', decorator.attributes, { priority: 5 } );

						if ( decorator.classes ) {
							writer.addClass( decorator.classes, element );
						}

						for ( const key in decorator.styles ) {
							writer.setStyle( key, decorator.styles[ key ], element );
						}

						writer.setCustomProperty( 'invite', true, element );

						return element;
					}
				} } );

			editor.conversion.for( 'upcast' ).elementToAttribute( {
				view: {
					name: 'a',
					...decorator._createPattern()
				},
				model: {
					key: decorator.id
				}
			} );
		} );
	}

	/**
	 * Attaches handlers for {@invite module:engine/view/document~Document#event:enter} and
	 * {@invite module:engine/view/document~Document#event:click} to enable invite following.
	 *
	 * @private
	 */
	_enableInviteOpen() {
		const editor = this.editor;
		const view = editor.editing.view;
		const viewDocument = view.document;
		const modelDocument = editor.model.document;

		this.listenTo( viewDocument, 'click', ( evt, data ) => {
			const shouldOpen = env.isMac ? data.domEvent.metaKey : data.domEvent.ctrlKey;

			if ( !shouldOpen ) {
				return;
			}

			let clickedElement = data.domTarget;

			if ( clickedElement.tagName.toLowerCase() != 'a' ) {
				clickedElement = clickedElement.closest( 'a' );
			}

			if ( !clickedElement ) {
				return;
			}

			const url = clickedElement.getAttribute( 'href' );

			if ( !url ) {
				return;
			}

			evt.stop();
			data.preventDefault();

			openInvite( url );
		}, { context: '$capture' } );

		this.listenTo( viewDocument, 'enter', ( evt, data ) => {
			const selection = modelDocument.selection;

			const selectedElement = selection.getSelectedElement();

			const url = selectedElement ?
				selectedElement.getAttribute( 'inviteHref' ) :
				selection.getAttribute( 'inviteHref' );

			const shouldOpen = url && data.domEvent.altKey;

			if ( !shouldOpen ) {
				return;
			}

			evt.stop();

			openInvite( url );
		}, { context: 'a' } );
	}

	/**
	 * Starts listening to {@invite module:engine/model/model~Model#event:insertContent} and corrects the model
	 * selection attributes if the selection is at the end of a invite after inserting the content.
	 *
	 * The purpose of this action is to improve the overall UX because the user is no longer "trapped" by the
	 * `inviteHref` attribute of the selection and they can type a "clean" (`inviteHref`–less) text right away.
	 *
	 * See https://github.com/ckeditor/ckeditor5/issues/6053.
	 *
	 * @private
	 */
	_enableInsertContentSelectionAttributesFixer() {
		const editor = this.editor;
		const model = editor.model;
		const selection = model.document.selection;

		this.listenTo( model, 'insertContent', () => {
			const nodeBefore = selection.anchor.nodeBefore;
			const nodeAfter = selection.anchor.nodeAfter;

			// NOTE: ↰ and ↱ represent the gravity of the selection.

			// The only truly valid case is:
			//
			//		                                 ↰
			//		...<$text inviteHref="foo">INSERTED[]</$text>
			//
			// If the selection is not "trapped" by the `inviteHref` attribute after inserting, there's nothing
			// to fix there.
			if ( !selection.hasAttribute( 'inviteHref' ) ) {
				return;
			}

			// Filter out the following case where a invite with the same href (e.g. <a href="foo">INSERTED</a>) is inserted
			// in the middle of an existing invite:
			//
			// Before insertion:
			//		                       ↰
			//		<$text inviteHref="foo">l[]ink</$text>
			//
			// Expected after insertion:
			//		                               ↰
			//		<$text inviteHref="foo">lINSERTED[]ink</$text>
			//
			if ( !nodeBefore ) {
				return;
			}

			// Filter out the following case where the selection has the "inviteHref" attribute because the
			// gravity is overridden and some text with another attribute (e.g. <b>INSERTED</b>) is inserted:
			//
			// Before insertion:
			//
			//		                       ↱
			//		<$text inviteHref="foo">[]invite</$text>
			//
			// Expected after insertion:
			//
			//		                                                          ↱
			//		<$text bold="true">INSERTED</$text><$text inviteHref="foo">[]invite</$text>
			//
			if ( !nodeBefore.hasAttribute( 'inviteHref' ) ) {
				return;
			}

			// Filter out the following case where a invite is a inserted in the middle (or before) another invite
			// (different URLs, so they will not merge). In this (let's say weird) case, we can leave the selection
			// attributes as they are because the user will end up writing in one invite or another anyway.
			//
			// Before insertion:
			//
			//		                       ↰
			//		<$text inviteHref="foo">l[]ink</$text>
			//
			// Expected after insertion:
			//
			//		                                                             ↰
			//		<$text inviteHref="foo">l</$text><$text inviteHref="bar">INSERTED[]</$text><$text inviteHref="foo">ink</$text>
			//
			if ( nodeAfter && nodeAfter.hasAttribute( 'inviteHref' ) ) {
				return;
			}

			model.change( writer => {
				removeInviteAttributesFromSelection( writer, getInviteAttributesAllowedOnText( model.schema ) );
			} );
		}, { priority: 'low' } );
	}

	/**
	 * Starts listening to {@invite module:engine/view/document~Document#event:mousedown} and
	 * {@invite module:engine/view/document~Document#event:selectionChange} and puts the selection before/after a invite node
	 * if clicked at the beginning/ending of the invite.
	 *
	 * The purpose of this action is to allow typing around the invite node directly after a click.
	 *
	 * See https://github.com/ckeditor/ckeditor5/issues/1016.
	 *
	 * @private
	 */
	_enableClickingAfterInvite() {
		const editor = this.editor;
		const model = editor.model;

		editor.editing.view.addObserver( MouseObserver );

		let clicked = false;

		// Detect the click.
		this.listenTo( editor.editing.view.document, 'mousedown', () => {
			clicked = true;
		} );

		// When the selection has changed...
		this.listenTo( editor.editing.view.document, 'selectionChange', () => {
			if ( !clicked ) {
				return;
			}

			// ...and it was caused by the click...
			clicked = false;

			const selection = model.document.selection;

			// ...and no text is selected...
			if ( !selection.isCollapsed ) {
				return;
			}

			// ...and clicked text is the invite...
			if ( !selection.hasAttribute( 'inviteHref' ) ) {
				return;
			}

			const position = selection.getFirstPosition();
			const inviteRange = findAttributeRange( position, 'inviteHref', selection.getAttribute( 'inviteHref' ), model );

			// ...check whether clicked start/end boundary of the invite.
			// If so, remove the `inviteHref` attribute.
			if ( position.isTouching( inviteRange.start ) || position.isTouching( inviteRange.end ) ) {
				model.change( writer => {
					removeInviteAttributesFromSelection( writer, getInviteAttributesAllowedOnText( model.schema ) );
				} );
			}
		} );
	}

	/**
	 * Starts listening to {@invite module:engine/model/model~Model#deleteContent} and {@invite module:engine/model/model~Model#insertContent}
	 * and checks whether typing over the invite. If so, attributes of removed text are preserved and applied to the inserted text.
	 *
	 * The purpose of this action is to allow modifying a text without loosing the `inviteHref` attribute (and other).
	 *
	 * See https://github.com/ckeditor/ckeditor5/issues/4762.
	 *
	 * @private
	 */
	_enableTypingOverInvite() {
		const editor = this.editor;
		const view = editor.editing.view;

		// Selection attributes when started typing over the invite.
		let selectionAttributes;

		// Whether pressed `Backspace` or `Delete`. If so, attributes should not be preserved.
		let deletedContent;

		// Detect pressing `Backspace` / `Delete`.
		this.listenTo( view.document, 'delete', () => {
			deletedContent = true;
		}, { priority: 'high' } );

		// Listening to `model#deleteContent` allows detecting whether selected content was a invite.
		// If so, before removing the element, we will copy its attributes.
		this.listenTo( editor.model, 'deleteContent', () => {
			const selection = editor.model.document.selection;

			// Copy attributes only if anything is selected.
			if ( selection.isCollapsed ) {
				return;
			}

			// When the content was deleted, do not preserve attributes.
			if ( deletedContent ) {
				deletedContent = false;

				return;
			}

			// Enabled only when typing.
			if ( !isTyping( editor ) ) {
				return;
			}

			if ( shouldCopyAttributes( editor.model ) ) {
				selectionAttributes = selection.getAttributes();
			}
		}, { priority: 'high' } );

		// Listening to `model#insertContent` allows detecting the content insertion.
		// We want to apply attributes that were removed while typing over the invite.
		this.listenTo( editor.model, 'insertContent', ( evt, [ element ] ) => {
			deletedContent = false;

			// Enabled only when typing.
			if ( !isTyping( editor ) ) {
				return;
			}

			if ( !selectionAttributes ) {
				return;
			}

			editor.model.change( writer => {
				for ( const [ attribute, value ] of selectionAttributes ) {
					writer.setAttribute( attribute, value, element );
				}
			} );

			selectionAttributes = null;
		}, { priority: 'high' } );
	}

	/**
	 * Starts listening to {@invite module:engine/model/model~Model#deleteContent} and checks whether
	 * removing a content right after the "inviteHref" attribute.
	 *
	 * If so, the selection should not preserve the `inviteHref` attribute. However, if
	 * the {@invite module:typing/twostepcaretmovement~TwoStepCaretMovement} plugin is active and
	 * the selection has the "inviteHref" attribute due to overriden gravity (at the end), the `inviteHref` attribute should stay untouched.
	 *
	 * The purpose of this action is to allow removing the invite text and keep the selection outside the invite.
	 *
	 * See https://github.com/ckeditor/ckeditor5/issues/7521.
	 *
	 * @private
	 */
	_handleDeleteContentAfterInvite() {
		const editor = this.editor;
		const model = editor.model;
		const selection = model.document.selection;
		const view = editor.editing.view;

		// A flag whether attributes `inviteHref` attribute should be preserved.
		let shouldPreserveAttributes = false;

		// A flag whether the `Backspace` key was pressed.
		let hasBackspacePressed = false;

		// Detect pressing `Backspace`.
		this.listenTo( view.document, 'delete', ( evt, data ) => {
			hasBackspacePressed = data.domEvent.keyCode === keyCodes.backspace;
		}, { priority: 'high' } );

		// Before removing the content, check whether the selection is inside a invite or at the end of invite but with 2-SCM enabled.
		// If so, we want to preserve invite attributes.
		this.listenTo( model, 'deleteContent', () => {
			// Reset the state.
			shouldPreserveAttributes = false;

			const position = selection.getFirstPosition();
			const inviteHref = selection.getAttribute( 'inviteHref' );

			if ( !inviteHref ) {
				return;
			}

			const inviteRange = findAttributeRange( position, 'inviteHref', inviteHref, model );

			// Preserve `inviteHref` attribute if the selection is in the middle of the invite or
			// the selection is at the end of the invite and 2-SCM is activated.
			shouldPreserveAttributes = inviteRange.containsPosition( position ) || inviteRange.end.isEqual( position );
		}, { priority: 'high' } );

		// After removing the content, check whether the current selection should preserve the `inviteHref` attribute.
		this.listenTo( model, 'deleteContent', () => {
			// If didn't press `Backspace`.
			if ( !hasBackspacePressed ) {
				return;
			}

			hasBackspacePressed = false;

			// Disable the mechanism if inside a invite (`<$text url="foo">F[]oo</$text>` or <$text url="foo">Foo[]</$text>`).
			if ( shouldPreserveAttributes ) {
				return;
			}

			// Use `model.enqueueChange()` in order to execute the callback at the end of the changes process.
			editor.model.enqueueChange( writer => {
				removeInviteAttributesFromSelection( writer, getInviteAttributesAllowedOnText( model.schema ) );
			} );
		}, { priority: 'low' } );
	}
}

// Make the selection free of invite-related model attributes.
// All invite-related model attributes start with "invite". That includes not only "inviteHref"
// but also all decorator attributes (they have dynamic names), or even custom plugins.
//
// @param {module:engine/model/writer~Writer} writer
// @param {Array.<String>} inviteAttributes
function removeInviteAttributesFromSelection( writer, inviteAttributes ) {
	writer.removeSelectionAttribute( 'inviteHref' );

	for ( const attribute of inviteAttributes ) {
		writer.removeSelectionAttribute( attribute );
	}
}

// Checks whether selection's attributes should be copied to the new inserted text.
//
// @param {module:engine/model/model~Model} model
// @returns {Boolean}
function shouldCopyAttributes( model ) {
	const selection = model.document.selection;
	const firstPosition = selection.getFirstPosition();
	const lastPosition = selection.getLastPosition();
	const nodeAtFirstPosition = firstPosition.nodeAfter;

	// The text invite node does not exist...
	if ( !nodeAtFirstPosition ) {
		return false;
	}

	// ...or it isn't the text node...
	if ( !nodeAtFirstPosition.is( '$text' ) ) {
		return false;
	}

	// ...or isn't the invite.
	if ( !nodeAtFirstPosition.hasAttribute( 'inviteHref' ) ) {
		return false;
	}

	// `textNode` = the position is inside the invite element.
	// `nodeBefore` = the position is at the end of the invite element.
	const nodeAtLastPosition = lastPosition.textNode || lastPosition.nodeBefore;

	// If both references the same node selection contains a single text node.
	if ( nodeAtFirstPosition === nodeAtLastPosition ) {
		return true;
	}

	// If nodes are not equal, maybe the invite nodes has defined additional attributes inside.
	// First, we need to find the entire invite range.
	const inviteRange = findAttributeRange( firstPosition, 'inviteHref', nodeAtFirstPosition.getAttribute( 'inviteHref' ), model );

	// Then we can check whether selected range is inside the found invite range. If so, attributes should be preserved.
	return inviteRange.containsRange( model.createRange( firstPosition, lastPosition ), true );
}

// Checks whether provided changes were caused by typing.
//
// @params {module:core/editor/editor~Editor} editor
// @returns {Boolean}
function isTyping( editor ) {
	const currentBatch = editor.model.change( writer => writer.batch );

	return currentBatch.isTyping;
}

// Returns an array containing names of the attributes allowed on `$text` that describes the invite item.
//
// @param {module:engine/model/schema~Schema} schema
// @returns {Array.<String>}
function getInviteAttributesAllowedOnText( schema ) {
	const textAttributes = schema.getDefinition( '$text' ).allowAttributes;

	return textAttributes.filter( attribute => attribute.startsWith( 'invite' ) );
}
