/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module image/imagedelete
 */

 import { Plugin } from 'ckeditor5/src/core';
 import ImageDeleteEditing from './imagedelete/imagedeleteediting';
 import ImageDeleteUI from './imagedelete/imagedeleteui';
 
 /**
  * The image text alternative plugin.
  *
  * For a detailed overview, check the {@glink features/images/images-styles image styles} documentation.
  *
  * This is a "glue" plugin which loads the
  *  {@link module:image/imagedelete/imagedeleteediting~ImageDeleteEditing}
  * and {@link module:image/imagedelete/imagedeleteui~ImageDeleteUI} plugins.
  *
  * @extends module:core/plugin~Plugin
  */
 export default class ImageDelete extends Plugin {
	 /**
	  * @inheritDoc
	  */
	 static get requires() {
		 return [ ImageDeleteEditing, ImageDeleteUI ];
	 }
 
	 /**
	  * @inheritDoc
	  */
	 static get pluginName() {
		 return 'ImageDelete';
	 }
 }
 