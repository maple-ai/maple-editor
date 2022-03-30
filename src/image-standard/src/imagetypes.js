/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module image/imagetypes
 */

import { Plugin } from 'ckeditor5/src/core';
import ImageStandardTypesButtons from './imagetypes/imagetypesbuttons';
import ImageStandardTypesEditing from './imagetypes/imagetypesediting';

import '../theme/imagetypes.css';
export default class ImageStandardTypes extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ ImageStandardTypesEditing, ImageStandardTypesButtons ];
	}

	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'ImageStandardTypes';
	}
}
