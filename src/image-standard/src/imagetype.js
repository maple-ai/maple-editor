/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module image/imagetype
 */

 import { Plugin } from 'ckeditor5/src/core';
 import ImageStandardTypeEditing from './imagetype/imagetypeediting';
 import ImageStandardTypeUI from './imagetype/imagetypeui';
 
 import '../theme/imagetype.css';
 
 /**
  * The image caption plugin.
  *
  * For a detailed overview, check the {@glink features/images/images-captions image caption} documentation.
  *
  * @extends module:core/plugin~Plugin
  */
 export default class ImageStandardType extends Plugin {
	 /**
	  * @inheritDoc
	  */
	 static get requires() {
		 return [ ImageStandardTypeEditing, ImageStandardTypeUI ];
	 }
 
	 /**
	  * @inheritDoc
	  */
	 static get pluginName() {
		 return 'ImageStandardType';
	 }
 }
 