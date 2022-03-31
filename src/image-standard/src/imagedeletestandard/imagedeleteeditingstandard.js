/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module image/imagedelete/imagedeleteediting
 */

import { Plugin } from 'ckeditor5/src/core';
import ImageStandardDeleteCommand from './imagedeletecommandstandard';
import ImageStandardUtils from '../imageutils';

/**
 * The image text alternative editing plugin.
 *
 * Registers the `'ImageStandardDelete'` command.
 *
 * @extends module:core/plugin~Plugin
 */
export default class ImageStandardDeleteEditing extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ ImageStandardUtils ];
	}

	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'ImageStandardDeleteEditing';
	}

	/**
	 * @inheritDoc
	 */
	init() {
		this.editor.commands.add( 'ImageStandardDelete', new ImageStandardDeleteCommand( this.editor ) );
	}
}
