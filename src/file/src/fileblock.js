/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module file/fileblock
 */

import { Plugin } from 'ckeditor5/src/core';
import { Widget } from 'ckeditor5/src/widget';

import FileBlockEditing from './file/fileblockediting';

import '../theme/file.css';

/**
 * The file inline plugin.
 *
 * This is a "glue" plugin which loads the following plugins:
 *
 * * {@link module:file/file/fileblockediting~FileBlockEditing},
 * * {@link module:file/filetextalternative~FileTextAlternative}.
 *
 * Usually, it is used in conjunction with other plugins from this package. See the {@glink api/file package page}
 * for more information.
 *
 * @extends module:core/plugin~Plugin
 */
export default class FileBlock extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ FileBlockEditing, Widget ];
	}

	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'FileBlock';
	}
}

