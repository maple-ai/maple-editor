/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module image/imagetextalternative
 */

import { Plugin } from 'ckeditor5/src/core';
import ImageStandardTextAlternativeEditing from './imagetextalternative/imagetextalternativeediting';
import ImageStandardTextAlternativeUI from './imagetextalternative/imagetextalternativeui';

/**
 * The image text alternative plugin.
 *
 * For a detailed overview, check the {@glink features/images/images-styles image styles} documentation.
 *
 * This is a "glue" plugin which loads the
 *  {@link module:image/imagetextalternative/imagetextalternativeediting~ImageStandardTextAlternativeEditing}
 * and {@link module:image/imagetextalternative/imagetextalternativeui~ImageStandardTextAlternativeUI} plugins.
 *
 * @extends module:core/plugin~Plugin
 */
export default class ImageStandardTextAlternative extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ ImageStandardTextAlternativeEditing, ImageStandardTextAlternativeUI ];
	}

	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'ImageStandardTextAlternative';
	}
}
