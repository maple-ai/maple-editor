/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module file/filedelete
 */

 import { Plugin } from 'ckeditor5/src/core';
 import FileDeleteEditing from './filedelete/filedeleteediting';
 import FileDeleteUI from './filedelete/filedeleteui';
 
 /**
  * The file text alternative plugin.
  *
  * For a detailed overview, check the {@glink features/files/files-styles file styles} documentation.
  *
  * This is a "glue" plugin which loads the
  *  {@link module:file/filedelete/filedeleteediting~FileDeleteEditing}
  * and {@link module:file/filedelete/filedeleteui~FileDeleteUI} plugins.
  *
  * @extends module:core/plugin~Plugin
  */
 export default class FileDelete extends Plugin {
	 /**
	  * @inheritDoc
	  */
	 static get requires() {
		 return [ FileDeleteEditing, FileDeleteUI ];
	 }
 
	 /**
	  * @inheritDoc
	  */
	 static get pluginName() {
		 return 'FileDelete';
	 }
 }
 