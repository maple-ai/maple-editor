/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module file/fileinsert
 */

import { Plugin } from 'ckeditor5/src/core';
import FileUpload from './fileupload';
import FileInsertUI from './filensert/fileinsertui';

/**
 * The file insert plugin.
 *
 * For a detailed overview, check the {@glink features/files/file-upload/file-upload File upload feature}
 * and {@glink features/files/file-upload/files-inserting#inserting-files-via-source-url Insert files via source URL} documentation.
 *
 * This plugin does not do anything directly, but it loads a set of specific plugins
 * to enable file uploading or inserting via implemented integrations:
 *
 * * {@link module:file/fileupload~FileUpload}
 * * {@link module:file/fileinsert/fileinsertui~FileInsertUI},
 *
 * @extends module:core/plugin~Plugin
 */
export default class FileInsert extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'FileInsert';
	}

	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ FileUpload, FileInsertUI ];
	}
}

/**
 * The file insert configuration.
 *
 * @member {module:file/fileinsert~FileInsertConfig} module:file/file~FileConfig#insert
 */

/**
 * The configuration of the file insert dropdown panel view. Used by the file insert feature in the `@ckeditor/ckeditor5-file` package.
 *
 *		ClassicEditor
 *			.create( editorElement, {
 * 				file: {
 * 					insert: {
 *						... // settings for "insertFile" view goes here
 * 					}
 * 				}
 *			} )
 *			.then( ... )
 *			.catch( ... );
 *
 * See {@link module:core/editor/editorconfig~EditorConfig all editor options}.
 *
 * @interface module:file/fileinsert~FileInsertConfig
 */

/**
 * The file insert panel view configuration contains a list of {@link module:file/fileinsert~FileInsert} integrations.
 *
 * The option accepts string tokens.
 * * for predefined integrations, we have two special strings: `insertFileViaUrl` and `openCKFinder`.
 * The former adds the **Insert file via URL** feature, while the latter adds the built-in **CKFinder** integration.
 * * for custom integrations, each string should be a name of the component registered in the
 * {@link module:ui/componentfactory~ComponentFactory component factory}.
 * If you have a plugin `PluginX` that registers `pluginXButton` component, then the integration token
 * in that case should be `pluginXButton`.
 *
 *		// Add `insertFileViaUrl`, `openCKFinder` and custom `pluginXButton` integrations.
 *		const fileInsertConfig = {
 *			insert: {
 *				integrations: [
 *					'insertFileViaUrl',
 *					'openCKFinder',
 *					'pluginXButton'
 *				]
 *			}
 *		};
 *
 * @protected
 * @member {Array.<String>} module:file/fileinsert~FileInsertConfig#integrations
 * @default [ 'insertFileViaUrl' ]
 */

/**
 * This options allows to override the file type used by the {@link module:file/file/insertfilecommand~InsertFileCommand} when the user
 * inserts new files into the editor content. By default, this option is unset which means the editor will choose the optimal file type
 * based on the context of the insertion (e.g. the current selection and availability of plugins)
 *
 * Available options are:
 *
 * * `'block'` – all files inserted into the editor will be block (requires the {@link module:file/fileblock~FileBlock} plugin),
 * * `'inline'` – all files inserted into the editor will be inline (requires the {@link module:file/fileinline~FileInline} plugin).
 *
 * @member {'inline'|'block'|undefined} module:file/fileinsert~FileInsertConfig#type
 */
