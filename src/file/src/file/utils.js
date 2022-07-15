/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module file/file/utils
 */

import { first } from 'ckeditor5/src/utils';

/**
 * Creates a view element representing the file of provided file type.
 *
 * An 'fileBlock' type (block file):
 *
 *		<figure class="file"><iframe></iframe></figure>
 *
 * An 'fileInline' type (inline file):
 *
 *		<span class="file-inline"><iframe></iframe></span>
 *
 * Note that `alt` and `src` attributes are converted separately, so they are not included.
 *
 * @protected
 * @param {module:engine/view/downcastwriter~DowncastWriter} writer
 * @param {'fileBlock'|'fileInline'} fileType The type of created file.
 * @returns {module:engine/view/containerelement~ContainerElement}
 */
export function createFileViewElement( writer, fileType ) {
	
	const emptyElement = writer.createEmptyElement( 'iframe' );

	const container = fileType === 'fileBlock' ?
		writer.createContainerElement( 'figure', { class: 'file' } ) :
		writer.createContainerElement( 'span', { class: 'file-inline' }, { isAllowedInsideAttributeElement: true } );

	writer.insert( writer.createPositionAt( container, 0 ), emptyElement );

	return container;
}

/**
 * A function returning a `MatcherPattern` for a particular type of View files.
 *
 * @protected
 * @param {module:core/editor/editor~Editor} editor
 * @param {'fileBlock'|'fileInline'} matchFileType The type of created file.
 * @returns {module:engine/view/matcher~MatcherPattern}
 */
export function getImgViewElementMatcher( editor, matchFileType ) {
	if ( editor.plugins.has( 'FileInlineEditing' ) !== editor.plugins.has( 'FileBlockEditing' ) ) {
		return { name: 'iframe' };
	}

	const fileUtils = editor.plugins.get( 'FileUtils' );

	return element => {
		// Check if view element is an `iframe`.
		if ( !fileUtils.isInlineFileView( element ) ) {
			return null;
		}

		// The <iframe> can be standalone, wrapped in <figure>...</figure> (FileBlock plugin) or
		// wrapped in <figure><a>...</a></figure> (LinkFile plugin).
		const fileType = element.findAncestor( fileUtils.isBlockFileView ) ? 'fileBlock' : 'fileInline';

		if ( fileType !== matchFileType ) {
			return null;
		}

		return { name: true };
	};
}

export function getCustomViewElementMatcher( editor, matchFileType ) {
	if ( editor.plugins.has( 'FileInlineEditing' ) !== editor.plugins.has( 'FileBlockEditing' ) ) {
		return { name: 'custom' };
	}

	const fileUtils = editor.plugins.get( 'FileUtils' );

	return element => {
		// Check if view element is an `iframe`.
		if ( !fileUtils.isInlineFileView( element ) ) {
			return null;
		}

		// The <iframe> can be standalone, wrapped in <figure>...</figure> (FileBlock plugin) or
		// wrapped in <figure><a>...</a></figure> (LinkFile plugin).
		const fileType = element.findAncestor( fileUtils.isBlockFileView ) ? 'fileBlock' : 'fileInline';

		if ( fileType !== matchFileType ) {
			return null;
		}

		return { name: true };
	};
}

/**
 * Considering the current model selection, it returns the name of the model file element
 * (`'fileBlock'` or `'fileInline'`) that will make most sense from the UX perspective if a new
 * file was inserted (also: uploaded, dropped, pasted) at that selection.
 *
 * The assumption is that inserting files into empty blocks or on other block widgets should
 * produce block files. Inline files should be inserted in other cases, e.g. in paragraphs
 * that already contain some text.
 *
 * @protected
 * @param {module:engine/model/schema~Schema} schema
 * @param {module:engine/model/selection~Selection|module:engine/model/documentselection~DocumentSelection} selection
 * @returns {'fileBlock'|'fileInline'}
 */
export function determineFileTypeForInsertionAtSelection( schema, selection ) {
	const firstBlock = first( selection.getSelectedBlocks() );

	// Insert a block file if the selection is not in/on block elements or it's on a block widget.
	if ( !firstBlock || schema.isObject( firstBlock ) ) {
		return 'fileBlock';
	}

	// A block file should also be inserted into an empty block element
	// (that is not an empty list item so the list won't get split).
	if ( firstBlock.isEmpty && firstBlock.name != 'listItem' ) {
		return 'fileBlock';
	}

	// Otherwise insert an inline file.
	return 'fileInline';
}
