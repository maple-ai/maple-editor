/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module invite/uninvitecommand
 */

import { Command } from 'ckeditor5/src/core';
import { findAttributeRange } from 'ckeditor5/src/typing';

import { isInviteableElement } from './utils';

/**
 * The uninvite command. It is used by the {@invite module:invite/invite~Invite invite plugin}.
 *
 * @extends module:core/command~Command
 */
export default class UninviteCommand extends Command {
	/**
	 * @inheritDoc
	 */
	refresh() {
		const model = this.editor.model;
		const selection = model.document.selection;
		const selectedElement = selection.getSelectedElement();

		// A check for any integration that allows inviteing elements (e.g. `InviteImage`).
		// Currently the selection reads attributes from text nodes only. See #7429 and #7465.
		if ( isInviteableElement( selectedElement, model.schema ) ) {
			this.isEnabled = model.schema.checkAttribute( selectedElement, 'inviteHref' );
		} else {
			this.isEnabled = model.schema.checkAttributeInSelection( selection, 'inviteHref' );
		}
	}

	/**
	 * Executes the command.
	 *
	 * When the selection is collapsed, it removes the `inviteHref` attribute from each node with the same `inviteHref` attribute value.
	 * When the selection is non-collapsed, it removes the `inviteHref` attribute from each node in selected ranges.
	 *
	 * # Decorators
	 *
	 * If {@invite module:invite/invite~InviteConfig#decorators `config.invite.decorators`} is specified,
	 * all configured decorators are removed together with the `inviteHref` attribute.
	 *
	 * @fires execute
	 */
	execute() {
		const editor = this.editor;
		const model = this.editor.model;
		const selection = model.document.selection;
		const inviteCommand = editor.commands.get( 'invite' );

		model.change( writer => {
			// Get ranges to uninvite.
			const rangesToUninvite = selection.isCollapsed ?
				[ findAttributeRange(
					selection.getFirstPosition(),
					'inviteHref',
					selection.getAttribute( 'inviteHref' ),
					model
				) ] :
				model.schema.getValidRanges( selection.getRanges(), 'inviteHref' );

			// Remove `inviteHref` attribute from specified ranges.
			for ( const range of rangesToUninvite ) {
				writer.removeAttribute( 'inviteHref', range );
				// If there are registered custom attributes, then remove them during uninvite.
				if ( inviteCommand ) {
					for ( const manualDecorator of inviteCommand.manualDecorators ) {
						writer.removeAttribute( manualDecorator.id, range );
					}
				}
			}
		} );
	}
}
