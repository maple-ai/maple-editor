/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module image/imagetype
 */

 import { Plugin } from 'ckeditor5/src/core';
 import ImageTypeEditing from './imagetype/imagetypeediting';
 import ImageTypeUI from './imagetype/imagetypeui';
 
 /**
  * The image text alternative plugin.
  *
  * For a detailed overview, check the {@glink features/images/images-styles image styles} documentation.
  *
  * This is a "glue" plugin which loads the
  *  {@link module:image/imagetype/imagetypeediting~ImageTypeEditing}
  * and {@link module:image/imagetype/imagetypeui~ImageTypeUI} plugins.
  *
  * @extends module:core/plugin~Plugin
  */
 export default class ImageType extends Plugin {
	 /**
	  * @inheritDoc
	  */
	 static get requires() {
		 return [ ImageTypeEditing, ImageTypeUI ];
	 }
 
	 /**
	  * @inheritDoc
	  */
	 static get pluginName() {
		 return 'ImageType';
	 }
 }
 