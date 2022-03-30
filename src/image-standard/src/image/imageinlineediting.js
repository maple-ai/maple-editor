/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module image/image/imageinlineediting
 */

import { Plugin } from 'ckeditor5/src/core';
import { ClipboardPipeline } from 'ckeditor5/src/clipboard';
import { UpcastWriter } from 'ckeditor5/src/engine';

import {
	downcastImageStandardAttribute,
	downcastSrcsetAttribute
} from './converters';

import ImageStandardEditing from './imageediting';
import ImageStandardTypeCommand from './imagetypecommand';
import ImageStandardUtils from '../imageutils';
import {
	getImgViewElementMatcher,
	getCustomViewElementMatcher,
	createImageStandardViewElement,
	determineImageStandardTypeForInsertionAtSelection
} from '../image/utils';

/**
 * The image inline plugin.
 *
 * It registers:
 *
 * * `<imageStandardInline>` as an inline element in the document schema, and allows `alt`, `src` and `srcset` attributes.
 * * converters for editing and data pipelines.
 * * {@link module:image/image/imagetypecommand~ImageStandardTypeCommand `'imageTypeInline'`} command that converts block images into
 * inline images.
 *
 * @extends module:core/plugin~Plugin
 */
export default class ImageStandardInlineEditing extends Plugin {
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
		return 'ImageStandardInlineEditing';
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;
		const schema = editor.model.schema;

		// Converters 'alt' and 'srcset' are added in 'ImageStandardEditing' plugin.
		schema.register( 'imageStandardInline', {
			isObject: true,
			isInline: true,
			allowWhere: '$text',
			allowAttributesOf: '$text',
			allowAttributes: [ 'alt', 'src', 'srcset' ]
		} );

		// Disallow inline images in captions (for now). This is the best spot to do that because
		// independent packages can introduce captions (ImageStandardCaption, TableCaption, etc.) so better this
		// be future-proof.
		// schema.addChildCheck( ( context, childDefinition ) => {
		// 	if ( context.endsWith( 'caption' ) && childDefinition.name === 'imageStandardInline' ) {
		// 		return false;
		// 	}
		// } );

		this._setupConversion();

		if ( editor.plugins.has( 'ImageStandardBlockEditing' ) ) {
			editor.commands.add( 'imageTypeInline', new ImageStandardTypeCommand( this.editor, 'imageStandardInline' ) );

			this._setupClipboardIntegration();
		}
	}

	/**
	 * Conimages conversion pipelines to support upcasting and downcasting
	 * inline images (inline image widgets) and their attributes.
	 *
	 * @private
	 */
	_setupConversion() {
		console.log("imageStandardInline");
		const editor = this.editor;
		const t = editor.t;
		const conversion = editor.conversion;
		const imageUtils = editor.plugins.get( 'ImageStandardUtils' );

		conversion.for( 'dataDowncast' )
			.elementToElement( {
				model: 'imageStandardInline',
				view: ( modelElement, { writer } ) => writer.createEmptyElement( 'image' )
			} ).elementToElement( {
				model: 'imageStandardInline',
				view: ( modelElement, { writer } ) => writer.createEmptyElement( 'custom' )
			} );

		conversion.for( 'editingDowncast' )
			.elementToElement( {
				model: 'imageStandardInline',
				view: ( modelElement, { writer } ) => imageUtils.toImageStandardWidget(
					createImageStandardViewElement( writer, 'imageStandardInline' ), writer, t( 'image widget' )
				)
			} );

		conversion.for( 'downcast' )
			.add( downcastImageStandardAttribute( imageUtils, 'imageStandardInline', 'src' ) )
			.add( downcastImageStandardAttribute( imageUtils, 'imageStandardInline', 'alt' ) )
			.add( downcastImageStandardAttribute( imageUtils, 'imageStandardInline', 'data-type' ) )
			.add( downcastSrcsetAttribute( imageUtils, 'imageStandardInline' ) );

		// More image related upcasts are in 'ImageStandardEditing' plugin.
		conversion.for( 'upcast' )
			.elementToElement( {
				view: getImgViewElementMatcher( editor, 'imageStandardInline' ),
				model: ( viewImageStandard, { writer } ) => writer.createElement(
					'imageStandardInline',
					viewImageStandard.hasAttribute( 'src' ) ? { src: viewImageStandard.getAttribute( 'src' ) } : null
				)
			} ).elementToElement( {
				view: getCustomViewElementMatcher( editor, 'imageStandardInline' ),
				model: ( viewImageStandard, { writer } ) => writer.createElement(
					'imageStandardInline',
					viewImageStandard.hasAttribute( 'src' ) ? { src: viewImageStandard.getAttribute( 'src' ) } : null
				)
			} );
	}

	/**
	 * Integrates the plugin with the clipboard pipeline.
	 *
	 * Idea is that the feature should recognize the user's intent when an **block** image is
	 * pasted or dropped. If such an image is pasted/dropped into a non-empty block
	 * (e.g. a paragraph with some text) it gets converted into an inline image on the fly.
	 *
	 * We assume this is the user's intent if they decided to put their image there.
	 *
	 * **Note**: If a block image has a caption, it will not be converted to an inline image
	 * to avoid the confusion. Captions are added on purpose and they should never be lost
	 * in the clipboard pipeline.
	 *
	 * See the `ImageStandardBlockEditing` for the similar integration that works in the opposite direction.
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

			// Make sure only <image class="image"></image> elements are dropped or pasted. Otherwise, if there some other HTML
			// mixed up, this should be handled as a regular paste.
			if ( !docFragmentChildren.every( imageUtils.isBlockImageStandardView ) ) {
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

			// Convert block images into inline images only when pasting or dropping into non-empty blocks
			// and when the block is not an object (e.g. pasting to replace another widget).
			// if ( determineImageStandardTypeForInsertionAtSelection( model.schema, selection ) === 'imageStandardInline' ) {
			// 	const writer = new UpcastWriter( editingView.document );

			// 	// Unwrap <image class="image"><image .../></image> -> <image ... />
			// 	// but <image class="image"><image .../><figcaption>...</figcaption></image> -> stays the same
			// 	const inlineViewImageStandards = docFragmentChildren.map( blockViewImageStandard => {
			// 		// If there's just one child, it can be either <image /> or <a><image></a>.
			// 		// If there are other children than <image>, this means that the block image
			// 		// has a caption or some other features and this kind of image should be
			// 		// pasted/dropped without modifications.
			// 		if ( blockViewImageStandard.childCount === 1 ) {
			// 			// Pass the attributes which are present only in the <image> to the <image>
			// 			// (e.g. the style="width:10%" attribute applied by the ImageStandardResize plugin).
			// 			Array.from( blockViewImageStandard.getAttributes() )
			// 				.forEach( attribute => writer.setAttribute(
			// 					...attribute,
			// 					imageUtils.findViewImgElement( blockViewImageStandard )
			// 				) );

			// 			return blockViewImageStandard.getChild( 0 );
			// 		} else {
			// 			return blockViewImageStandard;
			// 		}
			// 	} );

			// 	data.content = writer.createDocumentFragment( inlineViewImageStandards );
			// }
		} );
	}
}
