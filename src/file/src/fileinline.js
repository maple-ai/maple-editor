/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module file/fileinline
 */

import { Plugin } from 'ckeditor5/src/core';
import { Widget } from 'ckeditor5/src/widget';

import FileInlineEditing from './file/fileinlineediting';

import '../theme/file.css';

/**
 * The file inline plugin.
 *
 * This is a "glue" plugin which loads the following plugins:
 *
 * * {@link module:file/file/fileinlineediting~FileInlineEditing},
 * * {@link module:file/filetextalternative~FileTextAlternative}.
 *
 * Usually, it is used in conjunction with other plugins from this package. See the {@glink api/file package page}
 * for more information.
 *
 * @extends module:core/plugin~Plugin
 */
export default class FileInline extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ FileInlineEditing, Widget ];
	}

	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'FileInline';
	}
}

