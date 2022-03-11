/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module image/imagedelete/imagedeleteediting
 */

import { Plugin } from 'ckeditor5/src/core';
import ImageDeleteCommand from './imagedeletecommand';
import ImageUtils from '../imageutils';

/**
 * The image text alternative editing plugin.
 *
 * Registers the `'ImageDelete'` command.
 *
 * @extends module:core/plugin~Plugin
 */
export default class ImageDeleteEditing extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ ImageUtils ];
	}

	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'ImageDeleteEditing';
	}

	/**
	 * @inheritDoc
	 */
	init() {
		this.editor.commands.add( 'ImageDelete', new ImageDeleteCommand( this.editor ) );
	}
}
