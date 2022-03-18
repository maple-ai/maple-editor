/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module image/imagetypes/imagetypesediting
 */

import { Plugin } from 'ckeditor5/src/core';
import ImageUtils from '../imageutils';
import ResizeImageCommand from './imagetypescommand';
import {
	getImgViewElementMatcher,
} from '../image/utils';
/**
 * The image resize editing feature.
 *
 * It adds the ability to resize each image using handles or manually by
 * {@link module:image/imagetypes/imagetypesbuttons~ImageTypesButtons} buttons.
 *
 * @extends module:core/plugin~Plugin
 */
export default class ImageTypesEditing extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ ImageUtils ];
	}

	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'ImageTypesEditing';
	}

	/**
	 * @inheritDoc
	 */
	constructor( editor ) {
		super( editor );

		editor.config.define( 'image', {
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
		const imageTypesCommand = new ResizeImageCommand( editor );

		this._registerSchema();
		// this._registerConverters( 'imageBlock' );
		this._registerConverters( 'imageInline' );

		// Register `imageTypes` command and add `imageResize` command as an alias for backward compatibility.
		editor.commands.add( 'imageTypes', imageTypesCommand );
		// editor.commands.add( 'imageResize', imageTypesCommand );
	}

	/**
	 * @private
	 */
	_registerSchema() {
		if ( this.editor.plugins.has( 'ImageBlockEditing' ) ) {
			this.editor.model.schema.extend( 'imageBlock', { allowAttributes: 'type' } );
		}

		if ( this.editor.plugins.has( 'ImageInlineEditing' ) ) {
			this.editor.model.schema.extend( 'imageInline', { allowAttributes: 'type' } );
		}
	}

	/**
	 * Registers image resize converters.
	 *
	 * @private
	 * @param {'imageBlock'|'imageInline'} imageType The type of the image.
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
				const figure = conversionApi.mapper.toViewElement( data.item );
				const imageUtils = editor.plugins.get( 'ImageUtils' );
				const viewImg = imageUtils.findViewImgElement( figure );
				
				if ( data.attributeNewValue !== null ) {
					viewWriter.setStyle( 'type', data.attributeNewValue, figure );
					viewWriter.addClass( data.attributeNewValue, figure );
					// viewWriter.setAttribute( 'data-type', data.attributeNewValue, figure );
					viewWriter.setAttribute( 'data-type', data.attributeNewValue, viewImg );
					// const newCaptionElement = viewWriter.createElement( 'caption' );
				} else {
					viewWriter.removeStyle( 'type', figure );
					viewWriter.removeClass( data.attributeNewValue, figure );
					// viewWriter.removeAttribute( 'data-type', data.attributeNewValue, figure );
					viewWriter.removeAttribute( 'data-type', data.attributeNewValue, viewImg );
				}
			})
		);
	
		editor.conversion.for( 'upcast' )
			.attributeToAttribute( {
				view: {
					name: imageType === 'imageBlock' ? 'figure' : 'iframe',
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
