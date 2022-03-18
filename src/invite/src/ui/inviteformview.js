/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module invite/ui/inviteformview
 */

import {
	ButtonView,
	FocusCycler,
	LabeledFieldView,
	SwitchButtonView,
	View,
	ViewCollection,
	createLabeledInputText,
	injectCssTransitionDisabler,
	submitHandler
} from 'ckeditor5/src/ui';
import { FocusTracker, KeystrokeHandler } from 'ckeditor5/src/utils';
import { icons } from 'ckeditor5/src/core';

// See: #8833.
// eslint-disable-next-line ckeditor5-rules/ckeditor-imports
import '@ckeditor/ckeditor5-ui/theme/components/responsive-form/responsiveform.css';
import '../../theme/inviteform.css';

/**
 * The invite form view controller class.
 *
 * See {@invite module:invite/ui/inviteformview~InviteFormView}.
 *
 * @extends module:ui/view~View
 */
export default class InviteFormView extends View {
	/**
	 * Creates an instance of the {@invite module:invite/ui/inviteformview~InviteFormView} class.
	 *
	 * Also see {@invite #render}.
	 *
	 * @param {module:utils/locale~Locale} [locale] The localization services instance.
	 * @param {module:invite/invitecommand~InviteCommand} inviteCommand Reference to {@invite module:invite/invitecommand~InviteCommand}.
	 * @param {String} [protocol] A value of a protocol to be displayed in the input's placeholder.
	 */
	constructor( locale, inviteCommand ) {
		super( locale );

		const t = locale.t;

		/**
		 * Tracks information about DOM focus in the form.
		 *
		 * @readonly
		 * @member {module:utils/focustracker~FocusTracker}
		 */
		this.focusTracker = new FocusTracker();

		/**
		 * An instance of the {@invite module:utils/keystrokehandler~KeystrokeHandler}.
		 *
		 * @readonly
		 * @member {module:utils/keystrokehandler~KeystrokeHandler}
		 */
		this.keystrokes = new KeystrokeHandler();

		/**
		 * The URL input view.
		 *
		 * @member {module:ui/labeledfield/labeledfieldview~LabeledFieldView}
		 */
		this.urlInputView = this._createUrlInput();

		/**
		 * The Save button view.
		 *
		 * @member {module:ui/button/buttonview~ButtonView}
		 */
		this.saveButtonView = this._createButton( t( 'Save' ), icons.check, 'ck-button-save' );
		this.saveButtonView.type = 'submit';

		/**
		 * The Cancel button view.
		 *
		 * @member {module:ui/button/buttonview~ButtonView}
		 */
		this.cancelButtonView = this._createButton( t( 'Cancel' ), icons.cancel, 'ck-button-cancel', 'cancel' );

		/**
		 * A collection of {@invite module:ui/button/switchbuttonview~SwitchButtonView},
		 * which corresponds to {@invite module:invite/invitecommand~InviteCommand#manualDecorators manual decorators}
		 * configured in the editor.
		 *
		 * @private
		 * @readonly
		 * @type {module:ui/viewcollection~ViewCollection}
		 */
		this._manualDecoratorSwitches = this._createManualDecoratorSwitches( inviteCommand );

		/**
		 * A collection of child views in the form.
		 *
		 * @readonly
		 * @type {module:ui/viewcollection~ViewCollection}
		 */
		this.children = this._createFormChildren( inviteCommand.manualDecorators );

		/**
		 * A collection of views that can be focused in the form.
		 *
		 * @readonly
		 * @protected
		 * @member {module:ui/viewcollection~ViewCollection}
		 */
		this._focusables = new ViewCollection();

		/**
		 * Helps cycling over {@invite #_focusables} in the form.
		 *
		 * @readonly
		 * @protected
		 * @member {module:ui/focuscycler~FocusCycler}
		 */
		this._focusCycler = new FocusCycler( {
			focusables: this._focusables,
			focusTracker: this.focusTracker,
			keystrokeHandler: this.keystrokes,
			actions: {
				// Navigate form fields backwards using the Shift + Tab keystroke.
				focusPrevious: 'shift + tab',

				// Navigate form fields forwards using the Tab key.
				focusNext: 'tab'
			}
		} );

		const classList = [ 'ck', 'ck-invite-form', 'ck-responsive-form' ];

		if ( inviteCommand.manualDecorators.length ) {
			classList.push( 'ck-invite-form_layout-vertical', 'ck-vertical-form' );
		}

		this.setTemplate( {
			tag: 'form',

			attributes: {
				class: classList,

				// https://github.com/ckeditor/ckeditor5-invite/issues/90
				tabindex: '-1'
			},

			children: this.children
		} );

		injectCssTransitionDisabler( this );
	}

	/**
	 * Obtains the state of the {@invite module:ui/button/switchbuttonview~SwitchButtonView switch buttons} representing
	 * {@invite module:invite/invitecommand~InviteCommand#manualDecorators manual invite decorators}
	 * in the {@invite module:invite/ui/inviteformview~InviteFormView}.
	 *
	 * @returns {Object.<String,Boolean>} Key-value pairs, where the key is the name of the decorator and the value is
	 * its state.
	 */
	getDecoratorSwitchesState() {
		return Array.from( this._manualDecoratorSwitches ).reduce( ( accumulator, switchButton ) => {
			accumulator[ switchButton.name ] = switchButton.isOn;
			return accumulator;
		}, {} );
	}

	/**
	 * @inheritDoc
	 */
	render() {
		super.render();

		submitHandler( {
			view: this
		} );

		const childViews = [
			this.urlInputView,
			...this._manualDecoratorSwitches,
			this.saveButtonView,
			this.cancelButtonView
		];

		childViews.forEach( v => {
			// Register the view as focusable.
			this._focusables.add( v );

			// Register the view in the focus tracker.
			this.focusTracker.add( v.element );
		} );

		// Start listening for the keystrokes coming from #element.
		this.keystrokes.listenTo( this.element );
	}

	/**
	 * @inheritDoc
	 */
	destroy() {
		super.destroy();

		this.focusTracker.destroy();
		this.keystrokes.destroy();
	}

	/**
	 * Focuses the fist {@invite #_focusables} in the form.
	 */
	focus() {
		this._focusCycler.focusFirst();
	}

	/**
	 * Creates a labeled input view.
	 *
	 * @private
	 * @returns {module:ui/labeledfield/labeledfieldview~LabeledFieldView} Labeled field view instance.
	 */
	_createUrlInput() {
		const t = this.locale.t;
		const labeledInput = new LabeledFieldView( this.locale, createLabeledInputText );

		labeledInput.label = t( 'Invite to Maple' );

		return labeledInput;
	}

	/**
	 * Creates a button view.
	 *
	 * @private
	 * @param {String} label The button label.
	 * @param {String} icon The button icon.
	 * @param {String} className The additional button CSS class name.
	 * @param {String} [eventName] An event name that the `ButtonView#execute` event will be delegated to.
	 * @returns {module:ui/button/buttonview~ButtonView} The button view instance.
	 */
	_createButton( label, icon, className, eventName ) {
		const button = new ButtonView( this.locale );

		button.set( {
			label,
			icon,
			tooltip: true
		} );

		button.extendTemplate( {
			attributes: {
				class: className
			}
		} );

		if ( eventName ) {
			button.delegate( 'execute' ).to( this, eventName );
		}

		return button;
	}

	/**
	 * Populates {@invite module:ui/viewcollection~ViewCollection} of {@invite module:ui/button/switchbuttonview~SwitchButtonView}
	 * made based on {@invite module:invite/invitecommand~InviteCommand#manualDecorators}.
	 *
	 * @private
	 * @param {module:invite/invitecommand~InviteCommand} inviteCommand A reference to the invite command.
	 * @returns {module:ui/viewcollection~ViewCollection} of switch buttons.
	 */
	_createManualDecoratorSwitches( inviteCommand ) {
		const switches = this.createCollection();

		for ( const manualDecorator of inviteCommand.manualDecorators ) {
			const switchButton = new SwitchButtonView( this.locale );

			switchButton.set( {
				name: manualDecorator.id,
				label: manualDecorator.label,
				withText: true
			} );

			switchButton.bind( 'isOn' ).toMany( [ manualDecorator, inviteCommand ], 'value', ( decoratorValue, commandValue ) => {
				return commandValue === undefined && decoratorValue === undefined ? manualDecorator.defaultValue : decoratorValue;
			} );

			switchButton.on( 'execute', () => {
				manualDecorator.set( 'value', !switchButton.isOn );
			} );

			switches.add( switchButton );
		}

		return switches;
	}

	/**
	 * Populates the {@invite #children} collection of the form.
	 *
	 * If {@invite module:invite/invitecommand~InviteCommand#manualDecorators manual decorators} are configured in the editor, it creates an
	 * additional `View` wrapping all {@invite #_manualDecoratorSwitches} switch buttons corresponding
	 * to these decorators.
	 *
	 * @private
	 * @param {module:utils/collection~Collection} manualDecorators A reference to
	 * the collection of manual decorators stored in the invite command.
	 * @returns {module:ui/viewcollection~ViewCollection} The children of invite form view.
	 */
	_createFormChildren( manualDecorators ) {
		const children = this.createCollection();

		children.add( this.urlInputView );

		if ( manualDecorators.length ) {
			const additionalButtonsView = new View();

			additionalButtonsView.setTemplate( {
				tag: 'ul',
				children: this._manualDecoratorSwitches.map( switchButton => ( {
					tag: 'li',
					children: [ switchButton ],
					attributes: {
						class: [
							'ck',
							'ck-list__item'
						]
					}
				} ) ),
				attributes: {
					class: [
						'ck',
						'ck-reset',
						'ck-list'
					]
				}
			} );
			children.add( additionalButtonsView );
		}

		children.add( this.saveButtonView );
		children.add( this.cancelButtonView );

		return children;
	}
}

/**
 * Fired when the form view is submitted (when one of the children triggered the submit event),
 * for example with a click on {@invite #saveButtonView}.
 *
 * @event submit
 */

/**
 * Fired when the form view is canceled, for example with a click on {@invite #cancelButtonView}.
 *
 * @event cancel
 */
