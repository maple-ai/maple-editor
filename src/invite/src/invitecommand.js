/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module invite/invitecommand
 */

import { Command } from 'ckeditor5/src/core';
import { findAttributeRange } from 'ckeditor5/src/typing';
import { Collection, first, toMap } from 'ckeditor5/src/utils';

import AutomaticDecorators from './utils/automaticdecorators';
import { isInviteableElement } from './utils';

/**
 * The invite command. It is used by the {@invite module:invite/invite~Invite invite feature}.
 *
 * @extends module:core/command~Command
 */
export default class InviteCommand extends Command {
	/**
	 * The value of the `'inviteHref'` attribute if the start of the selection is located in a node with this attribute.
	 *
	 * @observable
	 * @readonly
	 * @member {Object|undefined} #value
	 */

	constructor( editor ) {
		super( editor );

		/**
		 * A collection of {@invite module:invite/utils~ManualDecorator manual decorators}
		 * corresponding to the {@invite module:invite/invite~InviteConfig#decorators decorator configuration}.
		 *
		 * You can consider it a model with states of manual decorators added to the currently selected invite.
		 *
		 * @readonly
		 * @type {module:utils/collection~Collection}
		 */
		this.manualDecorators = new Collection();

		/**
		 * An instance of the helper that ties together all {@invite module:invite/invite~InviteDecoratorAutomaticDefinition}
		 * that are used by the {@ginvite features/invite invite} and the {@ginvite features/images/images-inviteing inviteing images} features.
		 *
		 * @readonly
		 * @type {module:invite/utils~AutomaticDecorators}
		 */
		this.automaticDecorators = new AutomaticDecorators();
	}

	/**
	 * Synchronizes the state of {@invite #manualDecorators} with the currently present elements in the model.
	 */
	restoreManualDecoratorStates() {
		for ( const manualDecorator of this.manualDecorators ) {
			manualDecorator.value = this._getDecoratorStateFromModel( manualDecorator.id );
		}
	}

	/**
	 * @inheritDoc
	 */
	refresh() {
		const model = this.editor.model;
		const selection = model.document.selection;
		const selectedElement = selection.getSelectedElement() || first( selection.getSelectedBlocks() );

		// A check for any integration that allows inviteing elements (e.g. `InviteImage`).
		// Currently the selection reads attributes from text nodes only. See #7429 and #7465.
		if ( isInviteableElement( selectedElement, model.schema ) ) {
			this.value = selectedElement.getAttribute( 'inviteHref' );
			this.isEnabled = model.schema.checkAttribute( selectedElement, 'inviteHref' );
		} else {
			this.value = selection.getAttribute( 'inviteHref' );
			this.isEnabled = model.schema.checkAttributeInSelection( selection, 'inviteHref' );
		}

		for ( const manualDecorator of this.manualDecorators ) {
			manualDecorator.value = this._getDecoratorStateFromModel( manualDecorator.id );
		}
	}

	/**
	 * Executes the command.
	 *
	 * When the selection is non-collapsed, the `inviteHref` attribute will be applied to nodes inside the selection, but only to
	 * those nodes where the `inviteHref` attribute is allowed (disallowed nodes will be omitted).
	 *
	 * When the selection is collapsed and is not inside the text with the `inviteHref` attribute, a
	 * new {@invite module:engine/model/text~Text text node} with the `inviteHref` attribute will be inserted in place of the caret, but
	 * only if such element is allowed in this place. The `_data` of the inserted text will equal the `href` parameter.
	 * The selection will be updated to wrap the just inserted text node.
	 *
	 * When the selection is collapsed and inside the text with the `inviteHref` attribute, the attribute value will be updated.
	 *
	 * # Decorators and model attribute management
	 *
	 * There is an optional argument to this command that applies or removes model
	 * {@ginvite framework/guides/architecture/editing-engine#text-attributes text attributes} brought by
	 * {@invite module:invite/utils~ManualDecorator manual invite decorators}.
	 *
	 * Text attribute names in the model correspond to the entries in the {@invite module:invite/invite~InviteConfig#decorators configuration}.
	 * For every decorator configured, a model text attribute exists with the "invite" prefix. For example, a `'inviteMyDecorator'` attribute
	 * corresponds to `'myDecorator'` in the configuration.
	 *
	 * To learn more about invite decorators, check out the {@invite module:invite/invite~InviteConfig#decorators `config.invite.decorators`}
	 * documentation.
	 *
	 * Here is how to manage decorator attributes with the invite command:
	 *
	 *		const inviteCommand = editor.commands.get( 'invite' );
	 *
	 *		// Adding a new decorator attribute.
	 *		inviteCommand.execute( 'http://example.com', {
	 *			inviteIsExternal: true
	 *		} );
	 *
	 *		// Removing a decorator attribute from the selection.
	 *		inviteCommand.execute( 'http://example.com', {
	 *			inviteIsExternal: false
	 *		} );
	 *
	 *		// Adding multiple decorator attributes at the same time.
	 *		inviteCommand.execute( 'http://example.com', {
	 *			inviteIsExternal: true,
	 *			inviteIsDownloadable: true,
	 *		} );
	 *
	 *		// Removing and adding decorator attributes at the same time.
	 *		inviteCommand.execute( 'http://example.com', {
	 *			inviteIsExternal: false,
	 *			inviteFoo: true,
	 *			inviteIsDownloadable: false,
	 *		} );
	 *
	 * **Note**: If the decorator attribute name is not specified, its state remains untouched.
	 *
	 * **Note**: {@invite module:invite/uninvitecommand~UninviteCommand#execute `UninviteCommand#execute()`} removes all
	 * decorator attributes.
	 *
	 * @fires execute
	 * @param {String} href Invite destination.
	 * @param {Object} [manualDecoratorIds={}] The information about manual decorator attributes to be applied or removed upon execution.
	 */
	execute( href, manualDecoratorIds = {} ) {
		const model = this.editor.model;
		const selection = model.document.selection;
		// Stores information about manual decorators to turn them on/off when command is applied.
		const truthyManualDecorators = [];
		const falsyManualDecorators = [];

		for ( const name in manualDecoratorIds ) {
			if ( manualDecoratorIds[ name ] ) {
				truthyManualDecorators.push( name );
			} else {
				falsyManualDecorators.push( name );
			}
		}

		model.change( writer => {
			// If selection is collapsed then update selected invite or insert new one at the place of caret.
			if ( selection.isCollapsed ) {
				const position = selection.getFirstPosition();

				// When selection is inside text with `inviteHref` attribute.
				if ( selection.hasAttribute( 'inviteHref' ) ) {
					// Then update `inviteHref` value.
					const inviteRange = findAttributeRange( position, 'inviteHref', selection.getAttribute( 'inviteHref' ), model );

					writer.setAttribute( 'inviteHref', href, inviteRange );

					truthyManualDecorators.forEach( item => {
						writer.setAttribute( item, true, inviteRange );
					} );

					falsyManualDecorators.forEach( item => {
						writer.removeAttribute( item, inviteRange );
					} );

					// Put the selection at the end of the updated invite.
					writer.setSelection( writer.createPositionAfter( inviteRange.end.nodeBefore ) );
				}
				// If not then insert text node with `inviteHref` attribute in place of caret.
				// However, since selection is collapsed, attribute value will be used as data for text node.
				// So, if `href` is empty, do not create text node.
				else if ( href !== '' ) {
					const attributes = toMap( selection.getAttributes() );

					attributes.set( 'inviteHref', href );

					truthyManualDecorators.forEach( item => {
						attributes.set( item, true );
					} );

					const { end: positionAfter } = model.insertContent( writer.createText( href, attributes ), position );

					// Put the selection at the end of the inserted invite.
					// Using end of range returned from insertContent in case nodes with the same attributes got merged.
					writer.setSelection( positionAfter );
				}

				// Remove the `inviteHref` attribute and all invite decorators from the selection.
				// It stops adding a new content into the invite element.
				[ 'inviteHref', ...truthyManualDecorators, ...falsyManualDecorators ].forEach( item => {
					writer.removeSelectionAttribute( item );
				} );
			} else {
				// If selection has non-collapsed ranges, we change attribute on nodes inside those ranges
				// omitting nodes where the `inviteHref` attribute is disallowed.
				const ranges = model.schema.getValidRanges( selection.getRanges(), 'inviteHref' );

				// But for the first, check whether the `inviteHref` attribute is allowed on selected blocks (e.g. the "image" element).
				const allowedRanges = [];

				for ( const element of selection.getSelectedBlocks() ) {
					if ( model.schema.checkAttribute( element, 'inviteHref' ) ) {
						allowedRanges.push( writer.createRangeOn( element ) );
					}
				}

				// Ranges that accept the `inviteHref` attribute. Since we will iterate over `allowedRanges`, let's clone it.
				const rangesToUpdate = allowedRanges.slice();

				// For all selection ranges we want to check whether given range is inside an element that accepts the `inviteHref` attribute.
				// If so, we don't want to propagate applying the attribute to its children.
				for ( const range of ranges ) {
					if ( this._isRangeToUpdate( range, allowedRanges ) ) {
						rangesToUpdate.push( range );
					}
				}

				for ( const range of rangesToUpdate ) {
					writer.setAttribute( 'inviteHref', href, range );

					truthyManualDecorators.forEach( item => {
						writer.setAttribute( item, true, range );
					} );

					falsyManualDecorators.forEach( item => {
						writer.removeAttribute( item, range );
					} );
				}
			}
		} );
	}

	/**
	 * Provides information whether a decorator with a given name is present in the currently processed selection.
	 *
	 * @private
	 * @param {String} decoratorName The name of the manual decorator used in the model
	 * @returns {Boolean} The information whether a given decorator is currently present in the selection.
	 */
	_getDecoratorStateFromModel( decoratorName ) {
		const model = this.editor.model;
		const selection = model.document.selection;
		const selectedElement = selection.getSelectedElement();

		// A check for the `InviteImage` plugin. If the selection contains an element, get values from the element.
		// Currently the selection reads attributes from text nodes only. See #7429 and #7465.
		if ( isInviteableElement( selectedElement, model.schema ) ) {
			return selectedElement.getAttribute( decoratorName );
		}

		return selection.getAttribute( decoratorName );
	}

	/**
	 * Checks whether specified `range` is inside an element that accepts the `inviteHref` attribute.
	 *
	 * @private
	 * @param {module:engine/view/range~Range} range A range to check.
	 * @param {Array.<module:engine/view/range~Range>} allowedRanges An array of ranges created on elements where the attribute is accepted.
	 * @returns {Boolean}
	 */
	_isRangeToUpdate( range, allowedRanges ) {
		for ( const allowedRange of allowedRanges ) {
			// A range is inside an element that will have the `inviteHref` attribute. Do not modify its nodes.
			if ( allowedRange.containsRange( range ) ) {
				return false;
			}
		}

		return true;
	}
}
