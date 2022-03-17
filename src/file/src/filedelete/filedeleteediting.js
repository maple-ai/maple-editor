/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module file/filedelete/filedeleteediting
 */

import { Plugin } from 'ckeditor5/src/core';
import FileDeleteCommand from './filedeletecommand';
import FileUtils from '../fileutils';

/**
 * The file text alternative editing plugin.
 *
 * Registers the `'FileDelete'` command.
 *
 * @extends module:core/plugin~Plugin
 */
export default class FileDeleteEditing extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ FileUtils ];
	}

	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'FileDeleteEditing';
	}

	/**
	 * @inheritDoc
	 */
	init() {
		this.editor.commands.add( 'FileDelete', new FileDeleteCommand( this.editor ) );
	}
}
