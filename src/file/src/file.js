/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module file/file
 */

import { Plugin } from 'ckeditor5/src/core';

import FileBlock from './fileblock';
import FileInline from './fileinline';

import '../theme/file.css';

/**
 * The file plugin.
 *
 * For a detailed overview, check the {@glink features/files/files-overview file feature} documentation.
 *
 * This is a "glue" plugin which loads the following plugins:
 *
 * * {@link module:file/fileblock~FileBlock},
 * * {@link module:file/fileinline~FileInline},
 *
 * Usually, it is used in conjunction with other plugins from this package. See the {@glink api/file package page}
 * for more information.
 *
 * @extends module:core/plugin~Plugin
 */
export default class File extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ FileBlock, FileInline ];
	}

	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'File';
	}
}

/**
 * The configuration of the file features. Used by the file features in the `@ckeditor/ckeditor5-file` package.
 *
 * Read more in {@link module:file/file~FileConfig}.
 *
 * @member {module:file/file~FileConfig} module:core/editor/editorconfig~EditorConfig#file
 */

/**
 * The configuration of the file features. Used by the file features in the `@ckeditor/ckeditor5-file` package.
 *
 *		ClassicEditor
 *			.create( editorElement, {
 * 				file: ... // File feature options.
 *			} )
 *			.then( ... )
 *			.catch( ... );
 *
 * See {@link module:core/editor/editorconfig~EditorConfig all editor options}.
 *
 * @interface FileConfig
 */
