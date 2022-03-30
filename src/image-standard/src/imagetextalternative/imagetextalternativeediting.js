/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module image/imagetextalternative/imagetextalternativeediting
 */

import { Plugin } from 'ckeditor5/src/core';
import ImageStandardTextAlternativeCommand from './imagetextalternativecommand';
import ImageStandardUtils from '../imageutils';

/**
 * The image text alternative editing plugin.
 *
 * Registers the `'imageTextAlternative'` command.
 *
 * @extends module:core/plugin~Plugin
 */
export default class ImageStandardTextAlternativeEditing extends Plugin {
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
		return 'ImageStandardTextAlternativeEditing';
	}

	/**
	 * @inheritDoc
	 */
	init() {
		this.editor.commands.add( 'imageTextAlternative', new ImageStandardTextAlternativeCommand( this.editor ) );
	}
}
