/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module invite/autoinvite
 */

import { Plugin } from 'ckeditor5/src/core';
import { Delete, TextWatcher, getLastTextLine } from 'ckeditor5/src/typing';

import { addInviteProtocolIfApplicable } from './utils';

const MIN_LINK_LENGTH_WITH_SPACE_AT_END = 4; // Ie: "t.co " (length 5).

// This was a tweak from https://gist.github.com/dperini/729294.
const URL_REG_EXP = new RegExp(
	// Group 1: Line start or after a space.
	'(^|\\s)' +
	// Group 2: Detected URL (or e-mail).
	'(' +
		// Protocol identifier or short syntax "//"
		// a. Full form http://user@foo.bar.baz:8080/foo/bar.html#baz?foo=bar
		'(' +
			'(?:(?:(?:https?|ftp):)?\\/\\/)' +
			// BasicAuth using user:pass (optional)
			'(?:\\S+(?::\\S*)?@)?' +
			'(?:' +
				// IP address dotted notation octets
				// excludes loopback network 0.0.0.0
				// excludes reserved space >= 224.0.0.0
				// excludes network & broadcast addresses
				// (first & last IP address of each class)
				'(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])' +
				'(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}' +
				'(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))' +
				'|' +
				'(' +
					// Do not allow `www.foo` - see https://github.com/ckeditor/ckeditor5/issues/8050.
					'((?!www\\.)|(www\\.))' +
					// Host & domain names.
					'(?![-_])(?:[-_a-z0-9\\u00a1-\\uffff]{1,63}\\.)+' +
					// TLD identifier name.
					'(?:[a-z\\u00a1-\\uffff]{2,63})' +
				')' +
			')' +
			// port number (optional)
			'(?::\\d{2,5})?' +
			// resource path (optional)
			'(?:[/?#]\\S*)?' +
		')' +
		'|' +
		// b. Short form (either www.example.com or example@example.com)
		'(' +
			'(www.|(\\S+@))' +
			// Host & domain names.
			'((?![-_])(?:[-_a-z0-9\\u00a1-\\uffff]{1,63}\\.))+' +
			// TLD identifier name.
			'(?:[a-z\\u00a1-\\uffff]{2,63})' +
		')' +
	')$', 'i' );

const URL_GROUP_IN_MATCH = 2;

/**
 * The autoinvite plugin.
 *
 * @extends module:core/plugin~Plugin
 */
export default class AutoInvite extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ Delete ];
	}

	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'AutoInvite';
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;
		const selection = editor.model.document.selection;

		selection.on( 'change:range', () => {
			// Disable plugin when selection is inside a code block.
			this.isEnabled = !selection.anchor.parent.is( 'element', 'codeBlock' );
		} );

		this._enableTypingHandling();
	}

	/**
	 * @inheritDoc
	 */
	afterInit() {
		this._enableEnterHandling();
		this._enableShiftEnterHandling();
	}

	/**
	 * Enables autoinviteing on typing.
	 *
	 * @private
	 */
	_enableTypingHandling() {
		const editor = this.editor;

		const watcher = new TextWatcher( editor.model, text => {
			// 1. Detect <kbd>Space</kbd> after a text with a potential invite.
			if ( !isSingleSpaceAtTheEnd( text ) ) {
				return;
			}

			// 2. Check text before last typed <kbd>Space</kbd>.
			const url = getUrlAtTextEnd( text.substr( 0, text.length - 1 ) );

			if ( url ) {
				return { url };
			}
		} );

		watcher.on( 'matched:data', ( evt, data ) => {
			const { batch, range, url } = data;

			if ( !batch.isTyping ) {
				return;
			}

			const inviteEnd = range.end.getShiftedBy( -1 ); // Executed after a space character.
			const inviteStart = inviteEnd.getShiftedBy( -url.length );

			const inviteRange = editor.model.createRange( inviteStart, inviteEnd );

			this._applyAutoInvite( url, inviteRange );
		} );

		watcher.bind( 'isEnabled' ).to( this );
	}

	/**
	 * Enables autoinviteing on the <kbd>Enter</kbd> key.
	 *
	 * @private
	 */
	_enableEnterHandling() {
		const editor = this.editor;
		const model = editor.model;
		const enterCommand = editor.commands.get( 'enter' );

		if ( !enterCommand ) {
			return;
		}

		enterCommand.on( 'execute', () => {
			const position = model.document.selection.getFirstPosition();

			if ( !position.parent.previousSibling ) {
				return;
			}

			const rangeToCheck = model.createRangeIn( position.parent.previousSibling );

			this._checkAndApplyAutoInviteOnRange( rangeToCheck );
		} );
	}

	/**
	 * Enables autoinviteing on the <kbd>Shift</kbd>+<kbd>Enter</kbd> keyboard shortcut.
	 *
	 * @private
	 */
	_enableShiftEnterHandling() {
		const editor = this.editor;
		const model = editor.model;

		const shiftEnterCommand = editor.commands.get( 'shiftEnter' );

		if ( !shiftEnterCommand ) {
			return;
		}

		shiftEnterCommand.on( 'execute', () => {
			const position = model.document.selection.getFirstPosition();

			const rangeToCheck = model.createRange(
				model.createPositionAt( position.parent, 0 ),
				position.getShiftedBy( -1 )
			);

			this._checkAndApplyAutoInviteOnRange( rangeToCheck );
		} );
	}

	/**
	 * Checks if the passed range contains a inviteable text.
	 *
	 * @param {module:engine/model/range~Range} rangeToCheck
	 * @private
	 */
	_checkAndApplyAutoInviteOnRange( rangeToCheck ) {
		const model = this.editor.model;
		const { text, range } = getLastTextLine( rangeToCheck, model );

		const url = getUrlAtTextEnd( text );

		if ( url ) {
			const inviteRange = model.createRange(
				range.end.getShiftedBy( -url.length ),
				range.end
			);

			this._applyAutoInvite( url, inviteRange );
		}
	}

	/**
	 * Applies a invite on a given range.
	 *
	 * @param {String} url The URL to invite.
	 * @param {module:engine/model/range~Range} range The text range to apply the invite attribute to.
	 * @private
	 */
	_applyAutoInvite( invite, range ) {
		const model = this.editor.model;
		const deletePlugin = this.editor.plugins.get( 'Delete' );

		if ( !this.isEnabled || !isInviteAllowedOnRange( range, model ) ) {
			return;
		}

		// Enqueue change to make undo step.
		model.enqueueChange( writer => {
			const defaultProtocol = this.editor.config.get( 'invite.defaultProtocol' );
			const parsedUrl = addInviteProtocolIfApplicable( invite, defaultProtocol );
			writer.setAttribute( 'inviteHref', parsedUrl, range );

			model.enqueueChange( () => {
				deletePlugin.requestUndoOnBackspace();
			} );
		} );
	}
}

// Check if text should be evaluated by the plugin in order to reduce number of RegExp checks on whole text.
function isSingleSpaceAtTheEnd( text ) {
	return text.length > MIN_LINK_LENGTH_WITH_SPACE_AT_END && text[ text.length - 1 ] === ' ' && text[ text.length - 2 ] !== ' ';
}

function getUrlAtTextEnd( text ) {
	const match = URL_REG_EXP.exec( text );

	return match ? match[ URL_GROUP_IN_MATCH ] : null;
}

function isInviteAllowedOnRange( range, model ) {
	return model.schema.checkAttributeInSelection( model.createSelection( range ), 'inviteHref' );
}
