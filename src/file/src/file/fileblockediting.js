/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module file/file/fileblockediting
 */

import { Plugin } from 'ckeditor5/src/core';
import { ClipboardPipeline } from 'ckeditor5/src/clipboard';
import { UpcastWriter } from 'ckeditor5/src/engine';

import {
	downcastFileAttribute,
	downcastSrcsetAttribute,
	upcastFileFigure
} from './converters';

import FileEditing from './fileediting';
import FileTypeCommand from './filetypecommand';
import FileUtils from '../fileutils';
import {
	getImgViewElementMatcher,
	createFileViewElement,
	determineFileTypeForInsertionAtSelection
} from './utils';

/**
 * The file block plugin.
 *
 * It registers:
 *
 * * `<fileBlock>` as a block element in the document schema, and allows `alt`, `src` and `srcset` attributes.
 * * converters for editing and data pipelines.,
 * * {@link module:file/file/filetypecommand~FileTypeCommand `'fileTypeBlock'`} command that converts inline files into
 * block files.
 *
 * @extends module:core/plugin~Plugin
 */
export default class FileBlockEditing extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ FileEditing, FileUtils, ClipboardPipeline ];
	}

	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'FileBlockEditing';
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;
		const schema = editor.model.schema;

		// Converters 'alt' and 'srcset' are added in 'FileEditing' plugin.
		schema.register( 'fileBlock', {
			isObject: true,
			isBlock: true,
			allowWhere: '$block',
			allowAttributes: [ 'alt', 'src', 'srcset', 'data-type' ]
		} );

		this._setupConversion();

		if ( editor.plugins.has( 'FileInlineEditing' ) ) {
			editor.commands.add( 'fileTypeBlock', new FileTypeCommand( this.editor, 'fileBlock' ) );

			this._setupClipboardIntegration();
		}
	}

	/**
	 * Configures conversion pipelines to support upcasting and downcasting
	 * block files (block file widgets) and their attributes.
	 *
	 * @private
	 */
	_setupConversion() {
		const editor = this.editor;
		const t = editor.t;
		const conversion = editor.conversion;
		const fileUtils = editor.plugins.get( 'FileUtils' );

		conversion.for( 'dataDowncast' )
			.elementToElement( {
				model: 'fileBlock',
				view: ( modelElement, { writer } ) => createFileViewElement( writer, 'fileBlock' )
			} );

		conversion.for( 'editingDowncast' )
			.elementToElement( {
				model: 'fileBlock',
				view: ( modelElement, { writer } ) => fileUtils.toFileWidget(
					createFileViewElement( writer, 'fileBlock' ), writer, t( 'file widget' )
				)
			} );

		conversion.for( 'downcast' )
			.add( downcastFileAttribute( fileUtils, 'fileBlock', 'src' ) )
			.add( downcastFileAttribute( fileUtils, 'fileBlock', 'alt', 'data-type' ) )
			.add( downcastSrcsetAttribute( fileUtils, 'fileBlock' ) );

		// More file related upcasts are in 'FileEditing' plugin.
		conversion.for( 'upcast' )
			.elementToElement( {
				view: getImgViewElementMatcher( editor, 'fileBlock' ),
				model: ( viewFile, { writer } ) => writer.createElement(
					'fileBlock',
					viewFile.hasAttribute( 'src' ) ? { src: viewFile.getAttribute( 'src' ) } : null
				)
			} )
			.add( upcastFileFigure( fileUtils ) );
	}

	/**
	 * Integrates the plugin with the clipboard pipeline.
	 *
	 * Idea is that the feature should recognize the user's intent when an **inline** file is
	 * pasted or dropped. If such an file is pasted/dropped:
	 *
	 * * into an empty block (e.g. an empty paragraph),
	 * * on another object (e.g. some block widget).
	 *
	 * it gets converted into a block file on the fly. We assume this is the user's intent
	 * if they decided to put their file there.
	 *
	 * See the `FileInlineEditing` for the similar integration that works in the opposite direction.
	 *
	 * @private
	 */
	_setupClipboardIntegration() {
		const editor = this.editor;
		const model = editor.model;
		const editingView = editor.editing.view;
		const fileUtils = editor.plugins.get( 'FileUtils' );

		this.listenTo( editor.plugins.get( 'ClipboardPipeline' ), 'inputTransformation', ( evt, data ) => {
			const docFragmentChildren = Array.from( data.content.getChildren() );
			let modelRange;

			// Make sure only <iframe> elements are dropped or pasted. Otherwise, if there some other HTML
			// mixed up, this should be handled as a regular paste.
			if ( !docFragmentChildren.every( fileUtils.isInlineFileView ) ) {
				return;
			}

			// When drag and dropping, data.targetRanges specifies where to drop because
			// this is usually a different place than the current model selection (the user
			// uses a drop marker to specify the drop location).
			if ( data.targetRanges ) {
				modelRange = editor.editing.mapper.toModelRange( data.targetRanges[ 0 ] );
			}
			// Pasting, however, always occurs at the current model selection.
			else {
				modelRange = model.document.selection.getFirstRange();
			}

			const selection = model.createSelection( modelRange );

			// Convert inline files into block files only when the currently selected block is empty
			// (e.g. an empty paragraph) or some object is selected (to replace it).
			if ( determineFileTypeForInsertionAtSelection( model.schema, selection ) === 'fileBlock' ) {
				const writer = new UpcastWriter( editingView.document );

				// Wrap <iframe ... /> -> <figure class="file"><iframe .../></figure>
				const blockViewFiles = docFragmentChildren.map(
					inlineViewFile => writer.createElement( 'figure', { class: 'file' }, inlineViewFile )
				);

				data.content = writer.createDocumentFragment( blockViewFiles );
			}
		} );
	}
}
