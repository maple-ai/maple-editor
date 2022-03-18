/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module invite/inviteui
 */

import { Plugin } from 'ckeditor5/src/core';
import { ClickObserver } from 'ckeditor5/src/engine';
import { ButtonView, ContextualBalloon, clickOutsideHandler } from 'ckeditor5/src/ui';
import { isWidget } from 'ckeditor5/src/widget';
import InviteFormView from './ui/inviteformview';
import InviteActionsView from './ui/inviteactionsview';
import { addInviteProtocolIfApplicable, isInviteElement, LINK_KEYSTROKE } from './utils';

import inviteIcon from '../theme/icons/invite.svg';

const VISUAL_SELECTION_MARKER_NAME = 'invite-ui';

/**
 * The invite UI plugin. It introduces the `'invite'` and `'uninvite'` buttons and support for the <kbd>Ctrl+K</kbd> keystroke.
 *
 * It uses the
 * {@invite module:ui/panel/balloon/contextualballoon~ContextualBalloon contextual balloon plugin}.
 *
 * @extends module:core/plugin~Plugin
 */
export default class InviteUI extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ ContextualBalloon ];
	}

	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'InviteUI';
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;

		editor.editing.view.addObserver( ClickObserver );

		/**
		 * The actions view displayed inside of the balloon.
		 *
		 * @member {module:invite/ui/inviteactionsview~InviteActionsView}
		 */
		this.actionsView = this._createActionsView();

		/**
		 * The form view displayed inside the balloon.
		 *
		 * @member {module:invite/ui/inviteformview~InviteFormView}
		 */
		this.formView = this._createFormView();

		/**
		 * The contextual balloon plugin instance.
		 *
		 * @private
		 * @member {module:ui/panel/balloon/contextualballoon~ContextualBalloon}
		 */
		this._balloon = editor.plugins.get( ContextualBalloon );

		// Create toolbar buttons.
		this._createToolbarInviteButton();

		// Attach lifecycle actions to the the balloon.
		this._enableUserBalloonInteractions();

		// Renders a fake visual selection marker on an expanded selection.
		editor.conversion.for( 'editingDowncast' ).markerToHighlight( {
			model: VISUAL_SELECTION_MARKER_NAME,
			view: {
				classes: [ 'ck-fake-invite-selection' ]
			}
		} );

		// Renders a fake visual selection marker on a collapsed selection.
		editor.conversion.for( 'editingDowncast' ).markerToElement( {
			model: VISUAL_SELECTION_MARKER_NAME,
			view: {
				name: 'span',
				classes: [ 'ck-fake-invite-selection', 'ck-fake-invite-selection_collapsed' ]
			}
		} );
	}

	/**
	 * @inheritDoc
	 */
	destroy() {
		super.destroy();

		// Destroy created UI components as they are not automatically destroyed (see ckeditor5#1341).
		this.formView.destroy();
	}

	/**
	 * Creates the {@invite module:invite/ui/inviteactionsview~InviteActionsView} instance.
	 *
	 * @private
	 * @returns {module:invite/ui/inviteactionsview~InviteActionsView} The invite actions view instance.
	 */
	_createActionsView() {
		const editor = this.editor;
		const actionsView = new InviteActionsView( editor.locale );
		const inviteCommand = editor.commands.get( 'invite' );
		const uninviteCommand = editor.commands.get( 'uninvite' );

		actionsView.bind( 'href' ).to( inviteCommand, 'value' );
		actionsView.editButtonView.bind( 'isEnabled' ).to( inviteCommand );
		actionsView.uninviteButtonView.bind( 'isEnabled' ).to( uninviteCommand );

		// Execute uninvite command after clicking on the "Edit" button.
		this.listenTo( actionsView, 'edit', () => {
			this._addFormView();
		} );

		// Execute uninvite command after clicking on the "Uninvite" button.
		this.listenTo( actionsView, 'uninvite', () => {
			editor.execute( 'uninvite' );
			this._hideUI();
		} );

		// Close the panel on esc key press when the **actions have focus**.
		actionsView.keystrokes.set( 'Esc', ( data, cancel ) => {
			this._hideUI();
			cancel();
		} );

		// Open the form view on Ctrl+K when the **actions have focus**..
		actionsView.keystrokes.set( LINK_KEYSTROKE, ( data, cancel ) => {
			this._addFormView();
			cancel();
		} );

		return actionsView;
	}

	/**
	 * Creates the {@invite module:invite/ui/inviteformview~InviteFormView} instance.
	 *
	 * @private
	 * @returns {module:invite/ui/inviteformview~InviteFormView} The invite form view instance.
	 */
	_createFormView() {
		const editor = this.editor;
		const inviteCommand = editor.commands.get( 'invite' );
		const defaultProtocol = editor.config.get( 'invite.defaultProtocol' );

		const formView = new InviteFormView( editor.locale, inviteCommand );

		formView.urlInputView.fieldView.bind( 'value' ).to( inviteCommand, 'value' );

		// Form elements should be read-only when corresponding commands are disabled.
		formView.urlInputView.bind( 'isReadOnly' ).to( inviteCommand, 'isEnabled', value => !value );
		formView.saveButtonView.bind( 'isEnabled' ).to( inviteCommand );

		// Execute invite command after clicking the "Save" button.
		this.listenTo( formView, 'submit', () => {
			const { value } = formView.urlInputView.fieldView.element;
			const parsedUrl = addInviteProtocolIfApplicable( value, defaultProtocol );
			editor.execute( 'invite', parsedUrl, formView.getDecoratorSwitchesState() );
			this._closeFormView();
		} );

		// Hide the panel after clicking the "Cancel" button.
		this.listenTo( formView, 'cancel', () => {
			this._closeFormView();
		} );

		// Close the panel on esc key press when the **form has focus**.
		formView.keystrokes.set( 'Esc', ( data, cancel ) => {
			this._closeFormView();
			cancel();
		} );

		return formView;
	}

	/**
	 * Creates a toolbar Invite button. Clicking this button will show
	 * a {@invite #_balloon} attached to the selection.
	 *
	 * @private
	 */
	_createToolbarInviteButton() {
		const editor = this.editor;
		const inviteCommand = editor.commands.get( 'invite' );
		const t = editor.t;

		// Handle the `Ctrl+K` keystroke and show the panel.
		editor.keystrokes.set( LINK_KEYSTROKE, ( keyEvtData, cancel ) => {
			// Prevent focusing the search bar in FF, Chrome and Edge. See https://github.com/ckeditor/ckeditor5/issues/4811.
			cancel();

			if ( inviteCommand.isEnabled ) {
				this._showUI( true );
			}
		} );

		editor.ui.componentFactory.add( 'invite', locale => {
			const button = new ButtonView( locale );

			button.isEnabled = true;
			button.label = t( 'Invite' );
			button.icon = `<svg width="20" height="16" viewBox="0 0 20 16" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path d="M18 0H2C0.9 0 0.00999999 0.9 0.00999999 2L0 14C0 15.1 0.9 16 2 16H18C19.1 16 20 15.1 20 14V2C20 0.9 19.1 0 18 0ZM17.6 4.25L10.53 8.67C10.21 8.87 9.79 8.87 9.47 8.67L2.4 4.25C2.15 4.09 2 3.82 2 3.53C2 2.86 2.73 2.46 3.3 2.81L10 7L16.7 2.81C17.27 2.46 18 2.86 18 3.53C18 3.82 17.85 4.09 17.6 4.25Z" fill="#333333"/>
			</svg>
			
			`;
			button.keystroke = LINK_KEYSTROKE;
			button.tooltip = true;
			button.isToggleable = true;

			// Bind button to the command.
			button.bind( 'isEnabled' ).to( inviteCommand, 'isEnabled' );
			button.bind( 'isOn' ).to( inviteCommand, 'value', value => !!value );

			// Show the panel on button click.
			this.listenTo( button, 'execute', () => this._showUI( true ) );

			return button;
		} );
	}

	/**
	 * Attaches actions that control whether the balloon panel containing the
	 * {@invite #formView} is visible or not.
	 *
	 * @private
	 */
	_enableUserBalloonInteractions() {
		const viewDocument = this.editor.editing.view.document;

		// Handle click on view document and show panel when selection is placed inside the invite element.
		// Keep panel open until selection will be inside the same invite element.
		this.listenTo( viewDocument, 'click', () => {
			const parentInvite = this._getSelectedInviteElement();

			if ( parentInvite ) {
				// Then show panel but keep focus inside editor editable.
				this._showUI();
			}
		} );

		// Focus the form if the balloon is visible and the Tab key has been pressed.
		this.editor.keystrokes.set( 'Tab', ( data, cancel ) => {
			if ( this._areActionsVisible && !this.actionsView.focusTracker.isFocused ) {
				this.actionsView.focus();
				cancel();
			}
		}, {
			// Use the high priority because the invite UI navigation is more important
			// than other feature's actions, e.g. list indentation.
			// https://github.com/ckeditor/ckeditor5-invite/issues/146
			priority: 'high'
		} );

		// Close the panel on the Esc key press when the editable has focus and the balloon is visible.
		this.editor.keystrokes.set( 'Esc', ( data, cancel ) => {
			if ( this._isUIVisible ) {
				this._hideUI();
				cancel();
			}
		} );

		// Close on click outside of balloon panel element.
		clickOutsideHandler( {
			emitter: this.formView,
			activator: () => this._isUIInPanel,
			contextElements: [ this._balloon.view.element ],
			callback: () => this._hideUI()
		} );
	}

	/**
	 * Adds the {@invite #actionsView} to the {@invite #_balloon}.
	 *
	 * @protected
	 */
	_addActionsView() {
		if ( this._areActionsInPanel ) {
			return;
		}

		this._balloon.add( {
			view: this.actionsView,
			position: this._getBalloonPositionData()
		} );
	}

	/**
	 * Adds the {@invite #formView} to the {@invite #_balloon}.
	 *
	 * @protected
	 */
	_addFormView() {
		if ( this._isFormInPanel ) {
			return;
		}

		const editor = this.editor;
		const inviteCommand = editor.commands.get( 'invite' );

		this.formView.disableCssTransitions();

		this._balloon.add( {
			view: this.formView,
			position: this._getBalloonPositionData()
		} );

		// Select input when form view is currently visible.
		if ( this._balloon.visibleView === this.formView ) {
			this.formView.urlInputView.fieldView.select();
		}

		this.formView.enableCssTransitions();

		// Make sure that each time the panel shows up, the URL field remains in sync with the value of
		// the command. If the user typed in the input, then canceled the balloon (`urlInputView.fieldView#value` stays
		// unaltered) and re-opened it without changing the value of the invite command (e.g. because they
		// clicked the same invite), they would see the old value instead of the actual value of the command.
		// https://github.com/ckeditor/ckeditor5-invite/issues/78
		// https://github.com/ckeditor/ckeditor5-invite/issues/123
		this.formView.urlInputView.fieldView.element.value = inviteCommand.value || '';
	}

	/**
	 * Closes the form view. Decides whether the balloon should be hidden completely or if the action view should be shown. This is
	 * decided upon the invite command value (which has a value if the document selection is in the invite).
	 *
	 * Additionally, if any {@invite module:invite/invite~InviteConfig#decorators} are defined in the editor configuration, the state of
	 * switch buttons responsible for manual decorator handling is restored.
	 *
	 * @private
	 */
	_closeFormView() {
		const inviteCommand = this.editor.commands.get( 'invite' );

		// Restore manual decorator states to represent the current model state. This case is important to reset the switch buttons
		// when the user cancels the editing form.
		inviteCommand.restoreManualDecoratorStates();

		if ( inviteCommand.value !== undefined ) {
			this._removeFormView();
		} else {
			this._hideUI();
		}
	}

	/**
	 * Removes the {@invite #formView} from the {@invite #_balloon}.
	 *
	 * @protected
	 */
	_removeFormView() {
		if ( this._isFormInPanel ) {
			// Blur the input element before removing it from DOM to prevent issues in some browsers.
			// See https://github.com/ckeditor/ckeditor5/issues/1501.
			this.formView.saveButtonView.focus();

			this._balloon.remove( this.formView );

			// Because the form has an input which has focus, the focus must be brought back
			// to the editor. Otherwise, it would be lost.
			this.editor.editing.view.focus();

			this._hideFakeVisualSelection();
		}
	}

	/**
	 * Shows the correct UI type. It is either {@invite #formView} or {@invite #actionsView}.
	 *
	 * @param {Boolean} forceVisible
	 * @private
	 */
	_showUI( forceVisible = false ) {
		// When there's no invite under the selection, go straight to the editing UI.
		if ( !this._getSelectedInviteElement() ) {
			// Show visual selection on a text without a invite when the contextual balloon is displayed.
			// See https://github.com/ckeditor/ckeditor5/issues/4721.
			this._showFakeVisualSelection();

			this._addActionsView();

			// Be sure panel with invite is visible.
			if ( forceVisible ) {
				this._balloon.showStack( 'main' );
			}

			this._addFormView();
		}
		// If there's a invite under the selection...
		else {
			// Go to the editing UI if actions are already visible.
			if ( this._areActionsVisible ) {
				this._addFormView();
			}
			// Otherwise display just the actions UI.
			else {
				this._addActionsView();
			}

			// Be sure panel with invite is visible.
			if ( forceVisible ) {
				this._balloon.showStack( 'main' );
			}
		}

		// Begin responding to ui#update once the UI is added.
		this._startUpdatingUI();
	}

	/**
	 * Removes the {@invite #formView} from the {@invite #_balloon}.
	 *
	 * See {@invite #_addFormView}, {@invite #_addActionsView}.
	 *
	 * @protected
	 */
	_hideUI() {
		if ( !this._isUIInPanel ) {
			return;
		}

		const editor = this.editor;

		this.stopListening( editor.ui, 'update' );
		this.stopListening( this._balloon, 'change:visibleView' );

		// Make sure the focus always gets back to the editable _before_ removing the focused form view.
		// Doing otherwise causes issues in some browsers. See https://github.com/ckeditor/ckeditor5-invite/issues/193.
		editor.editing.view.focus();

		// Remove form first because it's on top of the stack.
		this._removeFormView();

		// Then remove the actions view because it's beneath the form.
		this._balloon.remove( this.actionsView );

		this._hideFakeVisualSelection();
	}

	/**
	 * Makes the UI react to the {@invite module:core/editor/editorui~EditorUI#event:update} event to
	 * reposition itself when the editor UI should be refreshed.
	 *
	 * See: {@invite #_hideUI} to learn when the UI stops reacting to the `update` event.
	 *
	 * @protected
	 */
	_startUpdatingUI() {
		const editor = this.editor;
		const viewDocument = editor.editing.view.document;

		let prevSelectedInvite = this._getSelectedInviteElement();
		let prevSelectionParent = getSelectionParent();

		const update = () => {
			const selectedInvite = this._getSelectedInviteElement();
			const selectionParent = getSelectionParent();

			// Hide the panel if:
			//
			// * the selection went out of the EXISTING invite element. E.g. user moved the caret out
			//   of the invite,
			// * the selection went to a different parent when creating a NEW invite. E.g. someone
			//   else modified the document.
			// * the selection has expanded (e.g. displaying invite actions then pressing SHIFT+Right arrow).
			//
			// Note: #_getSelectedInviteElement will return a invite for a non-collapsed selection only
			// when fully selected.
			if ( ( prevSelectedInvite && !selectedInvite ) ||
				( !prevSelectedInvite && selectionParent !== prevSelectionParent ) ) {
				this._hideUI();
			}
			// Update the position of the panel when:
			//  * invite panel is in the visible stack
			//  * the selection remains in the original invite element,
			//  * there was no invite element in the first place, i.e. creating a new invite
			else if ( this._isUIVisible ) {
				// If still in a invite element, simply update the position of the balloon.
				// If there was no invite (e.g. inserting one), the balloon must be moved
				// to the new position in the editing view (a new native DOM range).
				this._balloon.updatePosition( this._getBalloonPositionData() );
			}

			prevSelectedInvite = selectedInvite;
			prevSelectionParent = selectionParent;
		};

		function getSelectionParent() {
			return viewDocument.selection.focus.getAncestors()
				.reverse()
				.find( node => node.is( 'element' ) );
		}

		this.listenTo( editor.ui, 'update', update );
		this.listenTo( this._balloon, 'change:visibleView', update );
	}

	/**
	 * Returns `true` when {@invite #formView} is in the {@invite #_balloon}.
	 *
	 * @readonly
	 * @protected
	 * @type {Boolean}
	 */
	get _isFormInPanel() {
		return this._balloon.hasView( this.formView );
	}

	/**
	 * Returns `true` when {@invite #actionsView} is in the {@invite #_balloon}.
	 *
	 * @readonly
	 * @protected
	 * @type {Boolean}
	 */
	get _areActionsInPanel() {
		return this._balloon.hasView( this.actionsView );
	}

	/**
	 * Returns `true` when {@invite #actionsView} is in the {@invite #_balloon} and it is
	 * currently visible.
	 *
	 * @readonly
	 * @protected
	 * @type {Boolean}
	 */
	get _areActionsVisible() {
		return this._balloon.visibleView === this.actionsView;
	}

	/**
	 * Returns `true` when {@invite #actionsView} or {@invite #formView} is in the {@invite #_balloon}.
	 *
	 * @readonly
	 * @protected
	 * @type {Boolean}
	 */
	get _isUIInPanel() {
		return this._isFormInPanel || this._areActionsInPanel;
	}

	/**
	 * Returns `true` when {@invite #actionsView} or {@invite #formView} is in the {@invite #_balloon} and it is
	 * currently visible.
	 *
	 * @readonly
	 * @protected
	 * @type {Boolean}
	 */
	get _isUIVisible() {
		const visibleView = this._balloon.visibleView;

		return visibleView == this.formView || this._areActionsVisible;
	}

	/**
	 * Returns positioning options for the {@invite #_balloon}. They control the way the balloon is attached
	 * to the target element or selection.
	 *
	 * If the selection is collapsed and inside a invite element, the panel will be attached to the
	 * entire invite element. Otherwise, it will be attached to the selection.
	 *
	 * @private
	 * @returns {module:utils/dom/position~Options}
	 */
	_getBalloonPositionData() {
		const view = this.editor.editing.view;
		const model = this.editor.model;
		const viewDocument = view.document;
		let target = null;

		if ( model.markers.has( VISUAL_SELECTION_MARKER_NAME ) ) {
			// There are cases when we highlight selection using a marker (#7705, #4721).
			const markerViewElements = Array.from( this.editor.editing.mapper.markerNameToElements( VISUAL_SELECTION_MARKER_NAME ) );
			const newRange = view.createRange(
				view.createPositionBefore( markerViewElements[ 0 ] ),
				view.createPositionAfter( markerViewElements[ markerViewElements.length - 1 ] )
			);

			target = view.domConverter.viewRangeToDom( newRange );
		} else {
			// Make sure the target is calculated on demand at the last moment because a cached DOM range
			// (which is very fragile) can desynchronize with the state of the editing view if there was
			// any rendering done in the meantime. This can happen, for instance, when an inline widget
			// gets uninviteed.
			target = () => {
				const targetInvite = this._getSelectedInviteElement();

				return targetInvite ?
					// When selection is inside invite element, then attach panel to this element.
					view.domConverter.mapViewToDom( targetInvite ) :
					// Otherwise attach panel to the selection.
					view.domConverter.viewRangeToDom( viewDocument.selection.getFirstRange() );
			};
		}

		return { target };
	}

	/**
	 * Returns the invite {@invite module:engine/view/attributeelement~AttributeElement} under
	 * the {@invite module:engine/view/document~Document editing view's} selection or `null`
	 * if there is none.
	 *
	 * **Note**: For a non–collapsed selection, the invite element is returned when **fully**
	 * selected and the **only** element within the selection boundaries, or when
	 * a inviteed widget is selected.
	 *
	 * @private
	 * @returns {module:engine/view/attributeelement~AttributeElement|null}
	 */
	_getSelectedInviteElement() {
		const view = this.editor.editing.view;
		const selection = view.document.selection;
		const selectedElement = selection.getSelectedElement();

		// The selection is collapsed or some widget is selected (especially inline widget).
		if ( selection.isCollapsed || selectedElement && isWidget( selectedElement ) ) {
			return findInviteElementAncestor( selection.getFirstPosition() );
		} else {
			// The range for fully selected invite is usually anchored in adjacent text nodes.
			// Trim it to get closer to the actual invite element.
			const range = selection.getFirstRange().getTrimmed();
			const startInvite = findInviteElementAncestor( range.start );
			const endInvite = findInviteElementAncestor( range.end );

			if ( !startInvite || startInvite != endInvite ) {
				return null;
			}

			// Check if the invite element is fully selected.
			if ( view.createRangeIn( startInvite ).getTrimmed().isEqual( range ) ) {
				return startInvite;
			} else {
				return null;
			}
		}
	}

	/**
	 * Displays a fake visual selection when the contextual balloon is displayed.
	 *
	 * This adds a 'invite-ui' marker into the document that is rendered as a highlight on selected text fragment.
	 *
	 * @private
	 */
	_showFakeVisualSelection() {
		const model = this.editor.model;

		model.change( writer => {
			const range = model.document.selection.getFirstRange();

			if ( model.markers.has( VISUAL_SELECTION_MARKER_NAME ) ) {
				writer.updateMarker( VISUAL_SELECTION_MARKER_NAME, { range } );
			} else {
				if ( range.start.isAtEnd ) {
					const startPosition = range.start.getLastMatchingPosition(
						( { item } ) => !model.schema.isContent( item ),
						{ boundaries: range }
					);

					writer.addMarker( VISUAL_SELECTION_MARKER_NAME, {
						usingOperation: false,
						affectsData: false,
						range: writer.createRange( startPosition, range.end )
					} );
				} else {
					writer.addMarker( VISUAL_SELECTION_MARKER_NAME, {
						usingOperation: false,
						affectsData: false,
						range
					} );
				}
			}
		} );
	}

	/**
	 * Hides the fake visual selection created in {@invite #_showFakeVisualSelection}.
	 *
	 * @private
	 */
	_hideFakeVisualSelection() {
		const model = this.editor.model;

		if ( model.markers.has( VISUAL_SELECTION_MARKER_NAME ) ) {
			model.change( writer => {
				writer.removeMarker( VISUAL_SELECTION_MARKER_NAME );
			} );
		}
	}
}

// Returns a invite element if there's one among the ancestors of the provided `Position`.
//
// @private
// @param {module:engine/view/position~Position} View position to analyze.
// @returns {module:engine/view/attributeelement~AttributeElement|null} Invite element at the position or null.
function findInviteElementAncestor( position ) {
	return position.getAncestors().find( ancestor => isInviteElement( ancestor ) );
}
