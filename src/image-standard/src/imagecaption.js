/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module image/imagecaption
 */

import { Plugin } from 'ckeditor5/src/core';
import ImageStandardCaptionEditing from './imagecaption/imagecaptionediting';
import ImageStandardCaptionUI from './imagecaption/imagecaptionui';

import '../theme/imagecaption.css';

/**
 * The image caption plugin.
 *
 * For a detailed overview, check the {@glink features/images/images-captions image caption} documentation.
 *
 * @extends module:core/plugin~Plugin
 */
export default class ImageStandardCaption extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ ImageStandardCaptionEditing, ImageStandardCaptionUI ];
	}

	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'ImageStandardCaption';
	}
}
