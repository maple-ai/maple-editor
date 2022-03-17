/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module file/file/fileediting
 */

import { Plugin } from 'ckeditor5/src/core';
import FileLoadObserver from './fileloadobserver';
import InsertFileCommand from './insertfilecommand';
import FileUtils from '../fileutils';

/**
 * The file engine plugin. This module loads common code shared between
 * {@link module:file/file/fileinlineediting~FileInlineEditing} and
 * {@link module:file/file/fileblockediting~FileBlockEditing} plugins.
 *
 * This plugin registers the {@link module:file/file/insertfilecommand~InsertFileCommand 'insertFile'} command.
 *
 * @extends module:core/plugin~Plugin
 */
export default class FileEditing extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ FileUtils ];
	}

	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'FileEditing';
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;
		const conversion = editor.conversion;

		// See https://github.com/ckeditor/ckeditor5-file/issues/142.
		editor.editing.view.addObserver( FileLoadObserver );

		conversion.for( 'upcast' )
			.attributeToAttribute( {
				view: {
					name: 'iframe',
					key: 'data-type'
				},
				model: 'data-type'
			} )
			.attributeToAttribute( {
				view: {
					name: 'iframe',
					key: 'alt'
				},
				model: 'alt'
			} )
			.attributeToAttribute( {
				view: {
					name: 'iframe',
					key: 'srcset'
				},
				model: {
					key: 'srcset',
					value: viewFile => {
						const value = {
							data: viewFile.getAttribute( 'srcset' )
						};

						if ( viewFile.hasAttribute( 'width' ) ) {
							value.width = viewFile.getAttribute( 'width' );
						}

						return value;
					}
				}
			} );

		const insertFileCommand = new InsertFileCommand( editor );

		// Register `insertFile` command and add `fileInsert` command as an alias for backward compatibility.
		editor.commands.add( 'insertFile', insertFileCommand );
		editor.commands.add( 'fileInsert', insertFileCommand );
	}
}
