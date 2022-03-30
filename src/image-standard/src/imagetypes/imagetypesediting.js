/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module image/imagetypes/imagetypesediting
 */

import { Plugin } from 'ckeditor5/src/core';
import ImageStandardUtils from '../imageutils';
import ResizeImageStandardCommand from './imagetypescommand';
import {
	getImgViewElementMatcher,
} from '../image/utils';
/**
 * The image resize editing feature.
 *
 * It adds the ability to resize each image using handles or manually by
 * {@link module:image/imagetypes/imagetypesbuttons~ImageStandardTypesButtons} buttons.
 *
 * @extends module:core/plugin~Plugin
 */
export default class ImageStandardTypesEditing extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ ImageStandardUtils ];
	}

	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'ImageStandardTypesEditing';
	}

	/**
	 * @inheritDoc
	 */
	constructor( editor ) {
		super( editor );

		editor.config.define( 'imageStandard', {
			imageTypeUnit: '',
			imageTypeOptions: [
				{
					name: 'imageTypes:default',
					value: 'Default',
					label: 'Default'
				},
				{
					name: 'imageTypes:before',
					value: 'Before',
					label: 'Before'
				},
				{
					name: 'imageTypes:After',
					value: 'After',
					label: 'After'
				}
			]
		} );
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;
		const imageTypesCommand = new ResizeImageStandardCommand( editor );

		this._registerSchema();
		// this._registerConverters( 'imageStandardBlock' );
		this._registerConverters( 'imageStandardInline' );

		// Register `imageTypes` command and add `imageResize` command as an alias for backward compatibility.
		editor.commands.add( 'imageTypes', imageTypesCommand );
		// editor.commands.add( 'imageResize', imageTypesCommand );
	}

	/**
	 * @private
	 */
	_registerSchema() {
		if ( this.editor.plugins.has( 'ImageStandardBlockEditing' ) ) {
			this.editor.model.schema.extend( 'imageStandardBlock', { allowAttributes: 'type' } );
		}

		if ( this.editor.plugins.has( 'ImageStandardInlineEditing' ) ) {
			this.editor.model.schema.extend( 'imageStandardInline', { allowAttributes: 'type' } );
		}
	}

	/**
	 * Registers image resize converters.
	 *
	 * @private
	 * @param {'imageStandardBlock'|'imageStandardInline'} imageType The type of the image.
	 */
	_registerConverters( imageType ) {
		const editor = this.editor;

		editor.conversion.for( 'downcast' ).add( dispatcher =>
			dispatcher.on( `attribute:type:${ imageType }`, ( evt, data, conversionApi ) => {
				console.log("downcast", evt);
				console.log("downcast", data);
				if ( !conversionApi.consumable.consume( data.item, evt.name ) ) {
					return;
				}

				const viewWriter = conversionApi.writer;
				console.log("viewWriter", viewWriter);
				const image = conversionApi.mapper.toViewElement( data.item );
				const imageUtils = editor.plugins.get( 'ImageStandardUtils' );
				const viewImg = imageUtils.findViewImgElement( image );
				
				if ( data.attributeNewValue !== null ) {
					viewWriter.setStyle( 'type', data.attributeNewValue, image );
					viewWriter.addClass( data.attributeNewValue, image );
					// viewWriter.setAttribute( 'data-type', data.attributeNewValue, image );
					viewWriter.setAttribute( 'data-type', data.attributeNewValue, viewImg );
					// const newCaptionElement = viewWriter.createElement( 'caption' );
				} else {
					viewWriter.removeStyle( 'type', image );
					viewWriter.removeClass( data.attributeNewValue, image );
					// viewWriter.removeAttribute( 'data-type', data.attributeNewValue, image );
					viewWriter.removeAttribute( 'data-type', data.attributeNewValue, viewImg );
				}
			})
		);
	
		editor.conversion.for( 'upcast' )
			.attributeToAttribute( {
				view: {
					name: imageType === 'imageStandardBlock' ? 'image' : 'image',
					styles: {
						type: /.+/
					}
				},
				model: {
					key: 'type',
					value: viewElement => viewElement.getStyle( 'type' )
				}
			} );
	}

}
