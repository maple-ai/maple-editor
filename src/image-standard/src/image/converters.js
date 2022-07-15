/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module image/image/converters
 */

import { first } from 'ckeditor5/src/utils';

/**
 * Returns a function that converts the image view representation:
 *
 *		<image class="image"><image src="..." alt="..."></image></image>
 *
 * to the model representation:
 *
 *		<imageStandardBlock src="..." alt="..."></imageStandardBlock>
 *
 * The entire content of the `<image>` element except the first `<image>` is being converted as children
 * of the `<imageStandardBlock>` model element.
 *
 * @protected
 * @param {module:image/imageutils~ImageStandardUtils} imageUtils
 * @returns {Function}
 */
export function upcastImageStandardFigure( imageUtils ) {
	return dispatcher => {
		dispatcher.on( 'element:image', converter );
	};

	function converter( evt, data, conversionApi ) {
		// Do not convert if this is not an "image image".
		if ( !conversionApi.consumable.test( data.viewItem, { name: true, classes: 'imageStandard' } ) ) {
			return;
		}

		// Find an image element inside the image element.
		const viewImageStandard = imageUtils.findViewImgElement( data.viewItem );

		// Do not convert if image element is absent or was already converted.
		if ( !viewImageStandard || !conversionApi.consumable.test( viewImageStandard, { name: true } ) ) {
			return;
		}

		// Consume the image to prevent other converters from processing it again.
		conversionApi.consumable.consume( data.viewItem, { name: true, classes: 'imageStandard' } );

		// Convert view image to model image.
		const conversionResult = conversionApi.convertItem( viewImageStandard, data.modelCursor );

		// Get image element from conversion result.
		const modelImageStandard = first( conversionResult.modelRange.getItems() );

		// When image wasn't successfully converted then finish conversion.
		if ( !modelImageStandard ) {
			// Revert consumed image so other features can convert it.
			conversionApi.consumable.revert( data.viewItem, { name: true, classes: 'imageStandard' } );

			return;
		}

		// Convert rest of the image element's children as an image children.
		conversionApi.convertChildren( data.viewItem, modelImageStandard );

		conversionApi.updateConversionResult( modelImageStandard, data );
	}
}

/**
 * Returns a function that converts the image view representation:
 *
 *		<picture><source ... /><source ... />...<image ... /></picture>
 *
 * to the model representation as the `sources` attribute:
 *
 *		<image[Block|Inline] ... sources="..."></image[Block|Inline]>
 *
 * @protected
 * @param {module:image/imageutils~ImageStandardUtils} imageUtils
 * @returns {Function}
 */
export function upcastPicture( imageUtils ) {
	const sourceAttributeNames = [ 'srcset', 'media', 'type' ];

	return dispatcher => {
		dispatcher.on( 'element:picture', converter );
	};

	function converter( evt, data, conversionApi ) {
		const pictureViewElement = data.viewItem;

		// Do not convert <picture> if already consumed.
		if ( !conversionApi.consumable.test( pictureViewElement, { name: true } ) ) {
			return;
		}

		const sources = new Map();

		// Collect all <source /> elements attribute values.
		for ( const childSourceElement of pictureViewElement.getChildren() ) {
			if ( childSourceElement.is( 'element', 'source' ) ) {
				const attributes = {};

				for ( const name of sourceAttributeNames ) {
					if ( childSourceElement.hasAttribute( name ) ) {
						// Don't collect <source /> attribute if already consumed somewhere else.
						if ( conversionApi.consumable.test( childSourceElement, { attributes: name } ) ) {
							attributes[ name ] = childSourceElement.getAttribute( name );
						}
					}
				}

				if ( Object.keys( attributes ).length ) {
					sources.set( childSourceElement, attributes );
				}
			}
		}

		const imageViewElement = imageUtils.findViewImgElement( pictureViewElement );

		// Don't convert when a picture has no <image/> inside (it is broken).
		if ( !imageViewElement ) {
			return;
		}

		let modelImageStandard = data.modelCursor.parent;

		// - In case of an inline image (cursor parent in a <paragraph>), the <image/> must be converted right away
		// because no converter handled it yet and otherwise there would be no model element to set the sources attribute on.
		// - In case of a block image, the <image class="image"> converter (in ImageStandardBlockEditing) converts the
		// <image/> right away on its own and the modelCursor is already inside an imageStandardBlock and there's nothing special
		// to do here.
		if ( !modelImageStandard.is( 'element', 'imageStandardBlock' ) ) {
			const conversionResult = conversionApi.convertItem( imageViewElement, data.modelCursor );

			// Set image range as conversion result.
			data.modelRange = conversionResult.modelRange;

			// Continue conversion where image conversion ends.
			data.modelCursor = conversionResult.modelCursor;

			modelImageStandard = first( conversionResult.modelRange.getItems() );
		}

		conversionApi.consumable.consume( pictureViewElement, { name: true } );

		// Consume only these <source/> attributes that were actually collected and will be passed on
		// to the image model element.
		for ( const [ sourceElement, attributes ] of sources ) {
			conversionApi.consumable.consume( sourceElement, { attributes: Object.keys( attributes ) } );
		}

		if ( sources.size ) {
			conversionApi.writer.setAttribute( 'sources', Array.from( sources.values() ), modelImageStandard );
		}

		// Convert rest of the <picture> children as an image children. Other converters may want to consume them.
		conversionApi.convertChildren( pictureViewElement, modelImageStandard );
	}
}

/**
 * Converter used to convert the `srcset` model image attribute to the `srcset`, `sizes` and `width` attributes in the view.
 *
 * @protected
 * @param {module:image/imageutils~ImageStandardUtils} imageUtils
 * @param {'imageStandardBlock'|'imageStandardInline'} imageType The type of the image.
 * @returns {Function}
 */
export function downcastSrcsetAttribute( imageUtils, imageType ) {
	return dispatcher => {
		dispatcher.on( `attribute:srcset:${ imageType }`, converter );
	};

	function converter( evt, data, conversionApi ) {
		if ( !conversionApi.consumable.consume( data.item, evt.name ) ) {
			return;
		}

		const writer = conversionApi.writer;
		const element = conversionApi.mapper.toViewElement( data.item );
		const image = imageUtils.findViewImgElement( element );

		if ( data.attributeNewValue === null ) {
			const srcset = data.attributeOldValue;

			if ( srcset.data ) {
				writer.removeAttribute( 'srcset', image );
				writer.removeAttribute( 'sizes', image );

				if ( srcset.width ) {
					writer.removeAttribute( 'width', image );
				}
			}
		} else {
			const srcset = data.attributeNewValue;

			if ( srcset.data ) {
				writer.setAttribute( 'srcset', srcset.data, image );
				// Always outputting `100vw`. See https://github.com/ckeditor/ckeditor5-image/issues/2.
				writer.setAttribute( 'sizes', '100vw', image );

				if ( srcset.width ) {
					writer.setAttribute( 'width', srcset.width, image );
				}
			}
		}
	}
}

/**
 * Converts the `source` model attribute to the `<picture><source /><source />...<image /></picture>`
 * view structure.
 *
 * @protected
 * @param {module:image/imageutils~ImageStandardUtils} imageUtils
 * @returns {Function}
 */
export function downcastSourcesAttribute( imageUtils ) {
	return dispatcher => {
		dispatcher.on( 'attribute:sources:imageStandardBlock', converter );
		dispatcher.on( 'attribute:sources:imageStandardInline', converter );
	};

	function converter( evt, data, conversionApi ) {
		
		if ( !conversionApi.consumable.consume( data.item, evt.name ) ) {
			return;
		}

		const viewWriter = conversionApi.writer;
		const element = conversionApi.mapper.toViewElement( data.item );
		const imageElement = imageUtils.findViewImgElement( element );

		if ( data.attributeNewValue && data.attributeNewValue.length ) {
			// Make sure <picture> does not break attribute elements, for instance <a> in linked images.
			const pictureElement = viewWriter.createContainerElement( 'picture', {}, { isAllowedInsideAttributeElement: true } );

			for ( const sourceAttributes of data.attributeNewValue ) {
				const sourceElement = viewWriter.createEmptyElement( 'source', sourceAttributes );

				viewWriter.insert( viewWriter.createPositionAt( pictureElement, 'end' ), sourceElement );
			}

			// Collect all wrapping attribute elements.
			const attributeElements = [];
			let viewElement = imageElement.parent;

			while ( viewElement && viewElement.is( 'attributeElement' ) ) {
				const parentElement = viewElement.parent;

				viewWriter.unwrap( viewWriter.createRangeOn( imageElement ), viewElement );

				attributeElements.unshift( viewElement );
				viewElement = parentElement;
			}

			// Insert the picture and move image into it.
			viewWriter.insert( viewWriter.createPositionBefore( imageElement ), pictureElement );
			viewWriter.move( viewWriter.createRangeOn( imageElement ), viewWriter.createPositionAt( pictureElement, 'end' ) );

			// Apply collected attribute elements over the new picture element.
			for ( const attributeElement of attributeElements ) {
				viewWriter.wrap( viewWriter.createRangeOn( pictureElement ), attributeElement );
			}
		}
		// Both setting "sources" to an empty array and removing the attribute should unwrap the <image />.
		// Unwrap once if the latter followed the former, though.
		else if ( imageElement.parent.is( 'element', 'picture' ) ) {
			const pictureElement = imageElement.parent;

			viewWriter.move( viewWriter.createRangeOn( imageElement ), viewWriter.createPositionBefore( pictureElement ) );
			viewWriter.remove( pictureElement );
		}
	}
}

/**
 * Converter used to convert a given image attribute from the model to the view.
 *
 * @protected
 * @param {module:image/imageutils~ImageStandardUtils} imageUtils
 * @param {'imageStandardBlock'|'imageStandardInline'} imageType The type of the image.
 * @param {String} attributeKey The name of the attribute to convert.
 * @returns {Function}
 */
export function downcastImageStandardAttribute( imageUtils, imageType, attributeKey ) {
	return dispatcher => {
		dispatcher.on( `attribute:${ attributeKey }:${ imageType }`, converter );
	};

	function converter( evt, data, conversionApi ) {
		if ( !conversionApi.consumable.consume( data.item, evt.name ) ) {
			return;
		}

		const viewWriter = conversionApi.writer;
		const element = conversionApi.mapper.toViewElement( data.item );
		const image = imageUtils.findViewImgElement( element );

		viewWriter.setAttribute( data.attributeKey, data.attributeNewValue || '', image );
	}
}

