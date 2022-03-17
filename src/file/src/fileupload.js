/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module file/fileupload
 */

import { Plugin } from 'ckeditor5/src/core';
import FileUploadUI from './fileupload/fileuploadui';
import FileUploadProgress from './fileupload/fileuploadprogress';
import FileUploadEditing from './fileupload/fileuploadediting';

/**
 * The file upload plugin.
 *
 * For a detailed overview, check the {@glink features/files/file-upload/file-upload file upload feature} documentation.
 *
 * This plugin does not do anything directly, but it loads a set of specific plugins to enable file uploading:
 *
 * * {@link module:file/fileupload/fileuploadediting~FileUploadEditing},
 * * {@link module:file/fileupload/fileuploadui~FileUploadUI},
 * * {@link module:file/fileupload/fileuploadprogress~FileUploadProgress}.
 *
 * @extends module:core/plugin~Plugin
 */
export default class FileUpload extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'FileUpload';
	}

	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ FileUploadEditing, FileUploadUI, FileUploadProgress ];
	}
}

/**
 * The file upload configuration.
 *
 * @member {module:file/fileupload~FileUploadConfig} module:file/file~FileConfig#upload
 */

/**
 * The configuration of the file upload feature. Used by the file upload feature in the `@ckeditor/ckeditor5-file` package.
 *
 *		ClassicEditor
 *			.create( editorElement, {
 * 				file: {
 * 					upload:  ... // File upload feature options.
 * 				}
 *			} )
 *			.then( ... )
 *			.catch( ... );
 *
 * See {@link module:core/editor/editorconfig~EditorConfig all editor options}.
 *
 * @interface module:file/fileupload~FileUploadConfig
 */

/**
 * The list of accepted file types.
 *
 * The accepted types of files can be customized to allow only certain types of files:
 *
 *		// Allow only JPEG and PNG files:
 *		const fileUploadConfig = {
 *			types: [ 'png', 'jpeg' ]
 *		};
 *
 * The type string should match [one of the sub-types](https://www.iana.org/assignments/media-types/media-types.xhtml#file)
 * of the file MIME type. For example, for the `file/jpeg` MIME type, add `'jpeg'` to your file upload configuration.
 *
 * **Note:** This setting only restricts some file types to be selected and uploaded through the CKEditor UI and commands. File type
 * recognition and filtering should also be implemented on the server which accepts file uploads.
 *
 * @member {Array.<String>} module:file/fileupload~FileUploadConfig#types
 * @default [ 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff' ]
 */
