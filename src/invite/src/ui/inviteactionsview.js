/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module invite/ui/inviteactionsview
 */

import { ButtonView, View, ViewCollection, FocusCycler } from 'ckeditor5/src/ui';
import { FocusTracker, KeystrokeHandler } from 'ckeditor5/src/utils';
import { icons } from 'ckeditor5/src/core';

import { ensureSafeUrl } from '../utils';

// See: #8833.
// eslint-disable-next-line ckeditor5-rules/ckeditor-imports
import '@ckeditor/ckeditor5-ui/theme/components/responsive-form/responsiveform.css';
import '../../theme/inviteactions.css';

import uninviteIcon from '../../theme/icons/uninvite.svg';

/**
 * The invite actions view class. This view displays the invite preview, allows
 * uninviteing or editing the invite.
 *
 * @extends module:ui/view~View
 */
export default class InviteActionsView extends View {
	/**
	 * @inheritDoc
	 */
	constructor( locale ) {
		super( locale );

		const t = locale.t;

		/**
		 * Tracks information about DOM focus in the actions.
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
		 * The href preview view.
		 *
		 * @member {module:ui/view~View}
		 */
		this.previewButtonView = this._createPreviewButton();

		/**
		 * The uninvite button view.
		 *
		 * @member {module:ui/button/buttonview~ButtonView}
		 */
		this.uninviteButtonView = this._createButton( t( 'Uninvite' ), uninviteIcon, 'uninvite' );

		/**
		 * The edit invite button view.
		 *
		 * @member {module:ui/button/buttonview~ButtonView}
		 */
		this.editButtonView = this._createButton( t( 'Edit invite' ), icons.pencil, 'edit' );

		/**
		 * The value of the "href" attribute of the invite to use in the {@invite #previewButtonView}.
		 *
		 * @observable
		 * @member {String}
		 */
		this.set( 'href' );

		/**
		 * A collection of views that can be focused in the view.
		 *
		 * @readonly
		 * @protected
		 * @member {module:ui/viewcollection~ViewCollection}
		 */
		this._focusables = new ViewCollection();

		/**
		 * Helps cycling over {@invite #_focusables} in the view.
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
				// Navigate fields backwards using the Shift + Tab keystroke.
				focusPrevious: 'shift + tab',

				// Navigate fields forwards using the Tab key.
				focusNext: 'tab'
			}
		} );

		this.setTemplate( {
			tag: 'div',

			attributes: {
				class: [
					'ck',
					'ck-invite-actions',
					'ck-responsive-form'
				],

				// https://github.com/ckeditor/ckeditor5-invite/issues/90
				tabindex: '-1'
			},

			children: [
				this.previewButtonView,
				this.editButtonView,
				this.uninviteButtonView
			]
		} );
	}

	/**
	 * @inheritDoc
	 */
	render() {
		super.render();

		const childViews = [
			this.previewButtonView,
			this.editButtonView,
			this.uninviteButtonView
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
	 * Focuses the fist {@invite #_focusables} in the actions.
	 */
	focus() {
		this._focusCycler.focusFirst();
	}

	/**
	 * Creates a button view.
	 *
	 * @private
	 * @param {String} label The button label.
	 * @param {String} icon The button icon.
	 * @param {String} [eventName] An event name that the `ButtonView#execute` event will be delegated to.
	 * @returns {module:ui/button/buttonview~ButtonView} The button view instance.
	 */
	_createButton( label, icon, eventName ) {
		const button = new ButtonView( this.locale );

		button.set( {
			label,
			icon,
			tooltip: true
		} );

		button.delegate( 'execute' ).to( this, eventName );

		return button;
	}

	/**
	 * Creates a invite href preview button.
	 *
	 * @private
	 * @returns {module:ui/button/buttonview~ButtonView} The button view instance.
	 */
	_createPreviewButton() {
		const button = new ButtonView( this.locale );
		const bind = this.bindTemplate;
		const t = this.t;

		button.set( {
			withText: true,
			tooltip: t( 'Open invite in new tab' )
		} );

		button.extendTemplate( {
			attributes: {
				class: [
					'ck',
					'ck-invite-actions__preview'
				],
				href: bind.to( 'href', href => href && ensureSafeUrl( href ) ),
				target: '_blank',
				rel: 'noopener noreferrer'
			}
		} );

		button.bind( 'label' ).to( this, 'href', href => {
			return href || t( 'This invite has no URL' );
		} );

		button.bind( 'isEnabled' ).to( this, 'href', href => !!href );

		button.template.tag = 'a';
		button.template.eventListeners = {};

		return button;
	}
}

/**
 * Fired when the {@invite #editButtonView} is clicked.
 *
 * @event edit
 */

/**
 * Fired when the {@invite #uninviteButtonView} is clicked.
 *
 * @event uninvite
 */
