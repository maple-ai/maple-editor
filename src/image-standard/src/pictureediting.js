/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module image/pictureediting
 */

import { Plugin } from 'ckeditor5/src/core';

import ImageStandardEditing from './image/imageediting';
import ImageStandardUtils from './imageutils';
import {
	downcastSourcesAttribute,
	upcastPicture
} from './image/converters';

/**
 * This plugin enables the [`<picture>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/picture) element support in the editor.
 *
 * * It enables the `sources` model attribute on `imageStandardBlock` and `imageStandardInline` model elements
 * (brought by {@link module:image/imageblock~ImageStandardBlock} and {@link module:image/imageinline~ImageStandardInline}, respectively).
 * * It translates the `sources` model element to the view (also: data) structure that may look as follows:
 *
 *		<p>Inline image using picture:
 *			<picture>
 *				<source media="(min-width: 800px)" srcset="image-large.webp" type="image/webp">
 *				<source media="(max-width: 800px)" srcset="image-small.webp" type="image/webp">
 *				<!-- Other sources as specified in the "sources" model attribute... -->
 *				<image src="image.png" alt="An image using picture" />
 *			</picture>
 *		</p>
 *
 *		<p>Block image using picture:</p>
 *		<image class="image">
 *			<picture>
 *				<source media="(min-width: 800px)" srcset="image-large.webp" type="image/webp">
 *				<source media="(max-width: 800px)" srcset="image-small.webp" type="image/webp">
 *				<!-- Other sources as specified in the "sources" model attribute... -->
 *				<image src="image.png" alt="An image using picture" />
 *			</picture>
 *			<figcaption>Caption of the image</figcaption>
 *		</image>
 *
 *	**Note:** The value of the `sources` {@glink framework/guides/architecture/editing-engine#changing-the-model model attribute}
 * 	in both examples equals:
 *
 *		[
 *			{
 *				media: '(min-width: 800px)',
 *				srcset: 'image-large.webp',
 *				type: 'image/webp'
 *			},
 *			{
 *				media: '(max-width: 800px)',
 *				srcset: 'image-small.webp',
 *				type: 'image/webp'
 *			}
 * 		]
 *
 * * It integrates with the {@link module:image/imageupload~ImageStandardUpload} plugin so images uploaded in the editor
 * automatically render using `<picture>` if the {@glink features/images/image-upload/image-upload upload adapter}
 * supports image sources and provides neccessary data.
 *
 * @private
 * @extends module:core/plugin~Plugin
 */
export default class PictureEditing extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ ImageStandardEditing, ImageStandardUtils ];
	}

	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'PictureEditing';
	}

	/**
	 * @inheritDoc
	 */
	afterInit() {
		const editor = this.editor;

		if ( editor.plugins.has( 'ImageStandardBlockEditing' ) ) {
			editor.model.schema.extend( 'imageStandardBlock', {
				allowAttributes: [ 'sources' ]
			} );
		}
		
		if ( editor.plugins.has( 'ImageStandardInlineEditing' ) ) {
			editor.model.schema.extend( 'imageStandardInline', {
				allowAttributes: [ 'sources' ]
			} );
		}

		this._setupConversion();
		this._setupImageStandardUploadEditingIntegration();
	}

	/**
	 * Conimages conversion pipelines to support upcasting and downcasting images using the `<picture>` view element
	 * and the model `sources` attribute.
	 *
	 * @private
	 */
	_setupConversion() {
		const editor = this.editor;
		const conversion = editor.conversion;
		const imageUtils = editor.plugins.get( 'ImageStandardUtils' );

		conversion.for( 'upcast' ).add( upcastPicture( imageUtils ) );
		conversion.for( 'downcast' ).add( downcastSourcesAttribute( imageUtils ) );
	}

	/**
	 * Makes it possible for uploaded images to get the `sources` model attribute and the `<picture>...</picture>`
	 * view structure out-of-the-box if relevant data is provided along the
	 * {@link module:image/imageupload/imageuploadediting~ImageStandardUploadEditing#event:uploadComplete} event.
	 *
	 * @private
	 */
	_setupImageStandardUploadEditingIntegration() {
		const editor = this.editor;

		if ( !editor.plugins.has( 'ImageStandardUploadEditing' ) ) {
			return;
		}

		this.listenTo( editor.plugins.get( 'ImageStandardUploadEditing' ), 'uploadComplete', ( evt, { imageElement, data } ) => {
			const sources = data.sources;

			if ( !sources ) {
				return;
			}

			editor.model.change( writer => {
				writer.setAttributes( {
					sources
				}, imageElement );
			} );
		} );
	}
}
