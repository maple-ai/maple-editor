/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module image/image/imageblockediting
 */

import { Plugin } from 'ckeditor5/src/core';
import { ClipboardPipeline } from 'ckeditor5/src/clipboard';
import { UpcastWriter } from 'ckeditor5/src/engine';

import {
	downcastImageStandardAttribute,
	downcastSrcsetAttribute,
	upcastImageStandardFigure
} from './converters';

import ImageStandardEditing from './imageediting';
import ImageStandardTypeCommand from './imagetypecommand';
import ImageStandardUtils from '../imageutils';
import {
	getImgViewElementMatcher,
	createImageStandardViewElement,
	determineImageStandardTypeForInsertionAtSelection
} from '../image/utils';

/**
 * The image block plugin.
 *
 * It registers:
 *
 * * `<imageStandardBlock>` as a block element in the document schema, and allows `alt`, `src` and `srcset` attributes.
 * * converters for editing and data pipelines.,
 * * {@link module:image/image/imagetypecommand~ImageStandardTypeCommand `'imageTypeBlock'`} command that converts inline images into
 * block images.
 *
 * @extends module:core/plugin~Plugin
 */
export default class ImageStandardBlockEditing extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ ImageStandardEditing, ImageStandardUtils, ClipboardPipeline ];
	}

	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'ImageStandardBlockEditing';
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;
		const schema = editor.model.schema;

		// Converters 'alt' and 'srcset' are added in 'ImageStandardEditing' plugin.
		schema.register( 'imageStandardBlock', {
			isObject: true,
			isBlock: true,
			allowWhere: '$block',
			allowAttributes: [ 'alt', 'src', 'srcset', 'data-type' ]
		} );

		this._setupConversion();

		if ( editor.plugins.has( 'ImageStandardInlineEditing' ) ) {
			editor.commands.add( 'imageTypeBlock', new ImageStandardTypeCommand( this.editor, 'imageStandardBlock' ) );

			this._setupClipboardIntegration();
		}
	}

	/**
	 * Conimages conversion pipelines to support upcasting and downcasting
	 * block images (block image widgets) and their attributes.
	 *
	 * @private
	 */
	_setupConversion() {
		const editor = this.editor;
		const t = editor.t;
		const conversion = editor.conversion;
		const imageUtils = editor.plugins.get( 'ImageStandardUtils' );

		conversion.for( 'dataDowncast' )
			.elementToElement( {
				model: 'imageStandardBlock',
				view: ( modelElement, { writer } ) => createImageStandardViewElement( writer, 'imageStandardBlock' )
			} );

		conversion.for( 'editingDowncast' )
			.elementToElement( {
				model: 'imageStandardBlock',
				view: ( modelElement, { writer } ) => imageUtils.toImageStandardWidget(
					createImageStandardViewElement( writer, 'imageStandardBlock' ), writer, t( 'image widget' )
				)
			} );

		conversion.for( 'downcast' )
			.add( downcastImageStandardAttribute( imageUtils, 'imageStandardBlock', 'src' ) )
			.add( downcastImageStandardAttribute( imageUtils, 'imageStandardBlock', 'alt', 'data-type' ) )
			.add( downcastSrcsetAttribute( imageUtils, 'imageStandardBlock' ) );

		// More image related upcasts are in 'ImageStandardEditing' plugin.
		conversion.for( 'upcast' )
			.elementToElement( {
				view: getImgViewElementMatcher( editor, 'imageStandardBlock' ),
				model: ( viewImageStandard, { writer } ) => writer.createElement(
					'imageStandardBlock',
					viewImageStandard.hasAttribute( 'src' ) ? { src: viewImageStandard.getAttribute( 'src' ) } : null
				)
			} )
			.add( upcastImageStandardFigure( imageUtils ) );
	}

	/**
	 * Integrates the plugin with the clipboard pipeline.
	 *
	 * Idea is that the feature should recognize the user's intent when an **inline** image is
	 * pasted or dropped. If such an image is pasted/dropped:
	 *
	 * * into an empty block (e.g. an empty paragraph),
	 * * on another object (e.g. some block widget).
	 *
	 * it gets converted into a block image on the fly. We assume this is the user's intent
	 * if they decided to put their image there.
	 *
	 * See the `ImageStandardInlineEditing` for the similar integration that works in the opposite direction.
	 *
	 * @private
	 */
	_setupClipboardIntegration() {
		const editor = this.editor;
		const model = editor.model;
		const editingView = editor.editing.view;
		const imageUtils = editor.plugins.get( 'ImageStandardUtils' );

		this.listenTo( editor.plugins.get( 'ClipboardPipeline' ), 'inputTransformation', ( evt, data ) => {
			const docFragmentChildren = Array.from( data.content.getChildren() );
			let modelRange;

			// Make sure only <image> elements are dropped or pasted. Otherwise, if there some other HTML
			// mixed up, this should be handled as a regular paste.
			if ( !docFragmentChildren.every( imageUtils.isInlineImageStandardView ) ) {
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

			// Convert inline images into block images only when the currently selected block is empty
			// (e.g. an empty paragraph) or some object is selected (to replace it).
			if ( determineImageStandardTypeForInsertionAtSelection( model.schema, selection ) === 'imageStandardBlock' ) {
				const writer = new UpcastWriter( editingView.document );

				// Wrap <image ... /> -> <image class="image"><image .../></image>
				const blockViewImageStandards = docFragmentChildren.map(
					inlineViewImageStandard => writer.createElement( 'image', { class: 'imageStandard' }, inlineViewImageStandard )
				);

				data.content = writer.createDocumentFragment( blockViewImageStandards );
			}
		} );
	}
}
