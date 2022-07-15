/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module file/file/fileinlineediting
 */

import { Plugin } from 'ckeditor5/src/core';
import { ClipboardPipeline } from 'ckeditor5/src/clipboard';
import { UpcastWriter } from 'ckeditor5/src/engine';

import {
	downcastFileAttribute,
	downcastSrcsetAttribute
} from './converters';

import FileEditing from './fileediting';
import FileTypeCommand from './filetypecommand';
import FileUtils from '../fileutils';
import {
	getImgViewElementMatcher,
	getCustomViewElementMatcher,
	createFileViewElement,
	determineFileTypeForInsertionAtSelection
} from './utils';

/**
 * The file inline plugin.
 *
 * It registers:
 *
 * * `<fileInline>` as an inline element in the document schema, and allows `alt`, `src` and `srcset` attributes.
 * * converters for editing and data pipelines.
 * * {@link module:file/file/filetypecommand~FileTypeCommand `'fileTypeInline'`} command that converts block files into
 * inline files.
 *
 * @extends module:core/plugin~Plugin
 */
export default class FileInlineEditing extends Plugin {
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
		return 'FileInlineEditing';
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;
		const schema = editor.model.schema;

		// Converters 'alt' and 'srcset' are added in 'FileEditing' plugin.
		schema.register( 'fileInline', {
			isObject: true,
			isInline: true,
			allowWhere: '$text',
			allowAttributesOf: '$text',
			allowAttributes: [ 'alt', 'src', 'srcset' ]
		} );

		// Disallow inline files in captions (for now). This is the best spot to do that because
		// independent packages can introduce captions (FileCaption, TableCaption, etc.) so better this
		// be future-proof.
		// schema.addChildCheck( ( context, childDefinition ) => {
		// 	if ( context.endsWith( 'caption' ) && childDefinition.name === 'fileInline' ) {
		// 		return false;
		// 	}
		// } );

		this._setupConversion();

		if ( editor.plugins.has( 'FileBlockEditing' ) ) {
			editor.commands.add( 'fileTypeInline', new FileTypeCommand( this.editor, 'fileInline' ) );

			this._setupClipboardIntegration();
		}
	}

	/**
	 * Configures conversion pipelines to support upcasting and downcasting
	 * inline files (inline file widgets) and their attributes.
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
				model: 'fileInline',
				view: ( modelElement, { writer } ) => writer.createEmptyElement( 'iframe' )
			} ).elementToElement( {
				model: 'fileInline',
				view: ( modelElement, { writer } ) => writer.createEmptyElement( 'custom' )
			} );

		conversion.for( 'editingDowncast' )
			.elementToElement( {
				model: 'fileInline',
				view: ( modelElement, { writer } ) => fileUtils.toFileWidget(
					createFileViewElement( writer, 'fileInline' ), writer, t( 'file widget' )
				)
			} );

		conversion.for( 'downcast' )
			.add( downcastFileAttribute( fileUtils, 'fileInline', 'src' ) )
			.add( downcastFileAttribute( fileUtils, 'fileInline', 'alt' ) )
			.add( downcastFileAttribute( fileUtils, 'fileInline', 'data-type' ) )
			.add( downcastSrcsetAttribute( fileUtils, 'fileInline' ) );

		// More file related upcasts are in 'FileEditing' plugin.
		conversion.for( 'upcast' )
			.elementToElement( {
				view: getImgViewElementMatcher( editor, 'fileInline' ),
				model: ( viewFile, { writer } ) => writer.createElement(
					'fileInline',
					viewFile.hasAttribute( 'src' ) ? { src: viewFile.getAttribute( 'src' ) } : null
				)
			} ).elementToElement( {
				view: getCustomViewElementMatcher( editor, 'fileInline' ),
				model: ( viewFile, { writer } ) => writer.createElement(
					'fileInline',
					viewFile.hasAttribute( 'src' ) ? { src: viewFile.getAttribute( 'src' ) } : null
				)
			} );
	}

	/**
	 * Integrates the plugin with the clipboard pipeline.
	 *
	 * Idea is that the feature should recognize the user's intent when an **block** file is
	 * pasted or dropped. If such an file is pasted/dropped into a non-empty block
	 * (e.g. a paragraph with some text) it gets converted into an inline file on the fly.
	 *
	 * We assume this is the user's intent if they decided to put their file there.
	 *
	 * **Note**: If a block file has a caption, it will not be converted to an inline file
	 * to avoid the confusion. Captions are added on purpose and they should never be lost
	 * in the clipboard pipeline.
	 *
	 * See the `FileBlockEditing` for the similar integration that works in the opposite direction.
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

			// Make sure only <figure class="file"></figure> elements are dropped or pasted. Otherwise, if there some other HTML
			// mixed up, this should be handled as a regular paste.
			if ( !docFragmentChildren.every( fileUtils.isBlockFileView ) ) {
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

			// Convert block files into inline files only when pasting or dropping into non-empty blocks
			// and when the block is not an object (e.g. pasting to replace another widget).
			// if ( determineFileTypeForInsertionAtSelection( model.schema, selection ) === 'fileInline' ) {
			// 	const writer = new UpcastWriter( editingView.document );

			// 	// Unwrap <figure class="file"><iframe .../></figure> -> <iframe ... />
			// 	// but <figure class="file"><iframe .../><figcaption>...</figcaption></figure> -> stays the same
			// 	const inlineViewFiles = docFragmentChildren.map( blockViewFile => {
			// 		// If there's just one child, it can be either <iframe /> or <a><iframe></a>.
			// 		// If there are other children than <iframe>, this means that the block file
			// 		// has a caption or some other features and this kind of file should be
			// 		// pasted/dropped without modifications.
			// 		if ( blockViewFile.childCount === 1 ) {
			// 			// Pass the attributes which are present only in the <figure> to the <iframe>
			// 			// (e.g. the style="width:10%" attribute applied by the FileResize plugin).
			// 			Array.from( blockViewFile.getAttributes() )
			// 				.forEach( attribute => writer.setAttribute(
			// 					...attribute,
			// 					fileUtils.findViewImgElement( blockViewFile )
			// 				) );

			// 			return blockViewFile.getChild( 0 );
			// 		} else {
			// 			return blockViewFile;
			// 		}
			// 	} );

			// 	data.content = writer.createDocumentFragment( inlineViewFiles );
			// }
		} );
	}
}
