/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module image/imagetypes
 */

import { Plugin } from 'ckeditor5/src/core';
import ImageTypesButtons from './imagetypes/imagetypesbuttons';
import ImageTypesEditing from './imagetypes/imagetypesediting';

import '../theme/imagetypes.css';
export default class ImageTypes extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ ImageTypesEditing, ImageTypesButtons ];
	}

	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'ImageTypes';
	}
}
