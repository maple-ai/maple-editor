/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module image/image/utils
 */

import { first } from 'ckeditor5/src/utils';

/**
 * Creates a view element representing the image of provided image type.
 *
 * An 'imageStandardBlock' type (block image):
 *
 *		<image class="image"><image></image></image>
 *
 * An 'imageStandardInline' type (inline image):
 *
 *		<span class="image-inline"><image></image></span>
 *
 * Note that `alt` and `src` attributes are converted separately, so they are not included.
 *
 * @protected
 * @param {module:engine/view/downcastwriter~DowncastWriter} writer
 * @param {'imageStandardBlock'|'imageStandardInline'} imageType The type of created image.
 * @returns {module:engine/view/containerelement~ContainerElement}
 */
export function createImageStandardViewElement( writer, imageType ) {
	console.log("create element");
	const emptyElement = writer.createEmptyElement( 'image' );

	const container = imageType === 'imageStandardBlock' ?
		writer.createContainerElement( 'image', { class: 'imageStandard' } ) :
		writer.createContainerElement( 'span', { class: 'image-inline' }, { isAllowedInsideAttributeElement: true } );

	writer.insert( writer.createPositionAt( container, 0 ), emptyElement );

	return container;
}

/**
 * A function returning a `MatcherPattern` for a particular type of View images.
 *
 * @protected
 * @param {module:core/editor/editor~Editor} editor
 * @param {'imageStandardBlock'|'imageStandardInline'} matchImageStandardType The type of created image.
 * @returns {module:engine/view/matcher~MatcherPattern}
 */
export function getImgViewElementMatcher( editor, matchImageStandardType ) {
	if ( editor.plugins.has( 'ImageStandardInlineEditing' ) !== editor.plugins.has( 'ImageStandardBlockEditing' ) ) {
		return { name: 'image' };
	}

	const imageUtils = editor.plugins.get( 'ImageStandardUtils' );

	return element => {
		// Check if view element is an `image`.
		if ( !imageUtils.isInlineImageStandardView( element ) ) {
			return null;
		}

		// The <image> can be standalone, wrapped in <image>...</image> (ImageStandardBlock plugin) or
		// wrapped in <image><a>...</a></image> (LinkImageStandard plugin).
		const imageType = element.findAncestor( imageUtils.isBlockImageStandardView ) ? 'imageStandardBlock' : 'imageStandardInline';

		if ( imageType !== matchImageStandardType ) {
			return null;
		}

		return { name: true };
	};
}

export function getCustomViewElementMatcher( editor, matchImageStandardType ) {
	if ( editor.plugins.has( 'ImageStandardInlineEditing' ) !== editor.plugins.has( 'ImageStandardBlockEditing' ) ) {
		return { name: 'custom' };
	}

	const imageUtils = editor.plugins.get( 'ImageStandardUtils' );

	return element => {
		// Check if view element is an `image`.
		if ( !imageUtils.isInlineImageStandardView( element ) ) {
			return null;
		}

		// The <image> can be standalone, wrapped in <image>...</image> (ImageStandardBlock plugin) or
		// wrapped in <image><a>...</a></image> (LinkImageStandard plugin).
		const imageType = element.findAncestor( imageUtils.isBlockImageStandardView ) ? 'imageStandardBlock' : 'imageStandardInline';

		if ( imageType !== matchImageStandardType ) {
			return null;
		}

		return { name: true };
	};
}

/**
 * Considering the current model selection, it returns the name of the model image element
 * (`'imageStandardBlock'` or `'imageStandardInline'`) that will make most sense from the UX perspective if a new
 * image was inserted (also: uploaded, dropped, pasted) at that selection.
 *
 * The assumption is that inserting images into empty blocks or on other block widgets should
 * produce block images. Inline images should be inserted in other cases, e.g. in paragraphs
 * that already contain some text.
 *
 * @protected
 * @param {module:engine/model/schema~Schema} schema
 * @param {module:engine/model/selection~Selection|module:engine/model/documentselection~DocumentSelection} selection
 * @returns {'imageStandardBlock'|'imageStandardInline'}
 */
export function determineImageStandardTypeForInsertionAtSelection( schema, selection ) {
	const firstBlock = first( selection.getSelectedBlocks() );

	// Insert a block image if the selection is not in/on block elements or it's on a block widget.
	if ( !firstBlock || schema.isObject( firstBlock ) ) {
		return 'imageStandardBlock';
	}

	// A block image should also be inserted into an empty block element
	// (that is not an empty list item so the list won't get split).
	if ( firstBlock.isEmpty && firstBlock.name != 'listItem' ) {
		return 'imageStandardBlock';
	}

	// Otherwise insert an inline image.
	return 'imageStandardInline';
}
