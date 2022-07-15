/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module file/file/converters
 */

import { first } from 'ckeditor5/src/utils';

/**
 * Returns a function that converts the file view representation:
 *
 *		<figure class="file"><iframe src="..." alt="..."></iframe></figure>
 *
 * to the model representation:
 *
 *		<fileBlock src="..." alt="..."></fileBlock>
 *
 * The entire content of the `<figure>` element except the first `<iframe>` is being converted as children
 * of the `<fileBlock>` model element.
 *
 * @protected
 * @param {module:file/fileutils~FileUtils} fileUtils
 * @returns {Function}
 */
export function upcastFileFigure( fileUtils ) {
	return dispatcher => {
		dispatcher.on( 'element:figure', converter );
	};

	function converter( evt, data, conversionApi ) {
		// Do not convert if this is not an "file figure".
		if ( !conversionApi.consumable.test( data.viewItem, { name: true, classes: 'file' } ) ) {
			return;
		}

		// Find an file element inside the figure element.
		const viewFile = fileUtils.findViewImgElement( data.viewItem );

		// Do not convert if file element is absent or was already converted.
		if ( !viewFile || !conversionApi.consumable.test( viewFile, { name: true } ) ) {
			return;
		}

		// Consume the figure to prevent other converters from processing it again.
		conversionApi.consumable.consume( data.viewItem, { name: true, classes: 'file' } );

		// Convert view file to model file.
		const conversionResult = conversionApi.convertItem( viewFile, data.modelCursor );

		// Get file element from conversion result.
		const modelFile = first( conversionResult.modelRange.getItems() );

		// When file wasn't successfully converted then finish conversion.
		if ( !modelFile ) {
			// Revert consumed figure so other features can convert it.
			conversionApi.consumable.revert( data.viewItem, { name: true, classes: 'file' } );

			return;
		}

		// Convert rest of the figure element's children as an file children.
		conversionApi.convertChildren( data.viewItem, modelFile );

		conversionApi.updateConversionResult( modelFile, data );
	}
}

/**
 * Returns a function that converts the file view representation:
 *
 *		<picture><source ... /><source ... />...<iframe ... /></picture>
 *
 * to the model representation as the `sources` attribute:
 *
 *		<file[Block|Inline] ... sources="..."></file[Block|Inline]>
 *
 * @protected
 * @param {module:file/fileutils~FileUtils} fileUtils
 * @returns {Function}
 */
export function upcastPicture( fileUtils ) {
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

		const iframeViewElement = fileUtils.findViewImgElement( pictureViewElement );

		// Don't convert when a picture has no <iframe/> inside (it is broken).
		if ( !iframeViewElement ) {
			return;
		}

		let modelFile = data.modelCursor.parent;

		// - In case of an inline file (cursor parent in a <paragraph>), the <iframe/> must be converted right away
		// because no converter handled it yet and otherwise there would be no model element to set the sources attribute on.
		// - In case of a block file, the <figure class="file"> converter (in FileBlockEditing) converts the
		// <iframe/> right away on its own and the modelCursor is already inside an fileBlock and there's nothing special
		// to do here.
		if ( !modelFile.is( 'element', 'fileBlock' ) ) {
			const conversionResult = conversionApi.convertItem( iframeViewElement, data.modelCursor );

			// Set file range as conversion result.
			data.modelRange = conversionResult.modelRange;

			// Continue conversion where file conversion ends.
			data.modelCursor = conversionResult.modelCursor;

			modelFile = first( conversionResult.modelRange.getItems() );
		}

		conversionApi.consumable.consume( pictureViewElement, { name: true } );

		// Consume only these <source/> attributes that were actually collected and will be passed on
		// to the file model element.
		for ( const [ sourceElement, attributes ] of sources ) {
			conversionApi.consumable.consume( sourceElement, { attributes: Object.keys( attributes ) } );
		}

		if ( sources.size ) {
			conversionApi.writer.setAttribute( 'sources', Array.from( sources.values() ), modelFile );
		}

		// Convert rest of the <picture> children as an file children. Other converters may want to consume them.
		conversionApi.convertChildren( pictureViewElement, modelFile );
	}
}

/**
 * Converter used to convert the `srcset` model file attribute to the `srcset`, `sizes` and `width` attributes in the view.
 *
 * @protected
 * @param {module:file/fileutils~FileUtils} fileUtils
 * @param {'fileBlock'|'fileInline'} fileType The type of the file.
 * @returns {Function}
 */
export function downcastSrcsetAttribute( fileUtils, fileType ) {
	return dispatcher => {
		dispatcher.on( `attribute:srcset:${ fileType }`, converter );
	};

	function converter( evt, data, conversionApi ) {
		if ( !conversionApi.consumable.consume( data.item, evt.name ) ) {
			return;
		}

		const writer = conversionApi.writer;
		const element = conversionApi.mapper.toViewElement( data.item );
		const iframe = fileUtils.findViewImgElement( element );

		if ( data.attributeNewValue === null ) {
			const srcset = data.attributeOldValue;

			if ( srcset.data ) {
				writer.removeAttribute( 'srcset', iframe );
				writer.removeAttribute( 'sizes', iframe );

				if ( srcset.width ) {
					writer.removeAttribute( 'width', iframe );
				}
			}
		} else {
			const srcset = data.attributeNewValue;

			if ( srcset.data ) {
				writer.setAttribute( 'srcset', srcset.data, iframe );
				// Always outputting `100vw`. See https://github.com/ckeditor/ckeditor5-file/issues/2.
				writer.setAttribute( 'sizes', '100vw', iframe );

				if ( srcset.width ) {
					writer.setAttribute( 'width', srcset.width, iframe );
				}
			}
		}
	}
}

/**
 * Converts the `source` model attribute to the `<picture><source /><source />...<iframe /></picture>`
 * view structure.
 *
 * @protected
 * @param {module:file/fileutils~FileUtils} fileUtils
 * @returns {Function}
 */
export function downcastSourcesAttribute( fileUtils ) {
	return dispatcher => {
		dispatcher.on( 'attribute:sources:fileBlock', converter );
		dispatcher.on( 'attribute:sources:fileInline', converter );
		dispatcher.on( 'attribute:sources:fileInline', converter );
	};

	function converter( evt, data, conversionApi ) {
		
		if ( !conversionApi.consumable.consume( data.item, evt.name ) ) {
			return;
		}

		const viewWriter = conversionApi.writer;
		const element = conversionApi.mapper.toViewElement( data.item );
		const iframeElement = fileUtils.findViewImgElement( element );

		if ( data.attributeNewValue && data.attributeNewValue.length ) {
			// Make sure <picture> does not break attribute elements, for instance <a> in linked files.
			const pictureElement = viewWriter.createContainerElement( 'picture', {}, { isAllowedInsideAttributeElement: true } );

			for ( const sourceAttributes of data.attributeNewValue ) {
				const sourceElement = viewWriter.createEmptyElement( 'source', sourceAttributes );

				viewWriter.insert( viewWriter.createPositionAt( pictureElement, 'end' ), sourceElement );
			}

			// Collect all wrapping attribute elements.
			const attributeElements = [];
			let viewElement = iframeElement.parent;

			while ( viewElement && viewElement.is( 'attributeElement' ) ) {
				const parentElement = viewElement.parent;

				viewWriter.unwrap( viewWriter.createRangeOn( iframeElement ), viewElement );

				attributeElements.unshift( viewElement );
				viewElement = parentElement;
			}

			// Insert the picture and move iframe into it.
			viewWriter.insert( viewWriter.createPositionBefore( iframeElement ), pictureElement );
			viewWriter.move( viewWriter.createRangeOn( iframeElement ), viewWriter.createPositionAt( pictureElement, 'end' ) );

			// Apply collected attribute elements over the new picture element.
			for ( const attributeElement of attributeElements ) {
				viewWriter.wrap( viewWriter.createRangeOn( pictureElement ), attributeElement );
			}
		}
		// Both setting "sources" to an empty array and removing the attribute should unwrap the <iframe />.
		// Unwrap once if the latter followed the former, though.
		else if ( iframeElement.parent.is( 'element', 'picture' ) ) {
			const pictureElement = iframeElement.parent;

			viewWriter.move( viewWriter.createRangeOn( iframeElement ), viewWriter.createPositionBefore( pictureElement ) );
			viewWriter.remove( pictureElement );
		}
	}
}

/**
 * Converter used to convert a given file attribute from the model to the view.
 *
 * @protected
 * @param {module:file/fileutils~FileUtils} fileUtils
 * @param {'fileBlock'|'fileInline'} fileType The type of the file.
 * @param {String} attributeKey The name of the attribute to convert.
 * @returns {Function}
 */
export function downcastFileAttribute( fileUtils, fileType, attributeKey ) {
	return dispatcher => {
		dispatcher.on( `attribute:${ attributeKey }:${ fileType }`, converter );
	};

	function converter( evt, data, conversionApi ) {
		if ( !conversionApi.consumable.consume( data.item, evt.name ) ) {
			return;
		}

		const viewWriter = conversionApi.writer;
		const element = conversionApi.mapper.toViewElement( data.item );
		const iframe = fileUtils.findViewImgElement( element );

		viewWriter.setAttribute( data.attributeKey, data.attributeNewValue || '', iframe );
	}
}

