/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module image/imageresize/imageresizeediting
 */

import { Plugin } from 'ckeditor5/src/core';
import ImageStandardUtils from '../imageutils';
import ResizeImageStandardCommand from './resizeimagecommand';

/**
 * The image resize editing feature.
 *
 * It adds the ability to resize each image using handles or manually by
 * {@link module:image/imageresize/imageresizebuttons~ImageStandardResizeButtons} buttons.
 *
 * @extends module:core/plugin~Plugin
 */
export default class ImageStandardResizeEditing extends Plugin {
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
		return 'ImageStandardResizeEditing';
	}

	/**
	 * @inheritDoc
	 */
	constructor( editor ) {
		super( editor );

		editor.config.define( 'imageStandard', {
			resizeUnit: '%',
			resizeOptions: [ {
				name: 'resizeImageStandard:original',
				value: null,
				icon: 'original'
			},
			{
				name: 'resizeImageStandard:25',
				value: '25',
				icon: 'small'
			},
			{
				name: 'resizeImageStandard:50',
				value: '50',
				icon: 'medium'
			},
			{
				name: 'resizeImageStandard:75',
				value: '75',
				icon: 'large'
			} ]
		} );
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;
		const resizeImageStandardCommand = new ResizeImageStandardCommand( editor );

		this._registerSchema();
		this._registerConverters( 'imageStandardBlock' );
		this._registerConverters( 'imageStandardInline' );

		// Register `resizeImageStandard` command and add `imageResize` command as an alias for backward compatibility.
		editor.commands.add( 'resizeImageStandard', resizeImageStandardCommand );
		editor.commands.add( 'imageResize', resizeImageStandardCommand );
	}

	/**
	 * @private
	 */
	_registerSchema() {
		if ( this.editor.plugins.has( 'ImageStandardBlockEditing' ) ) {
			this.editor.model.schema.extend( 'imageStandardBlock', { allowAttributes: 'width' } );
		}

		if ( this.editor.plugins.has( 'ImageStandardInlineEditing' ) ) {
			this.editor.model.schema.extend( 'imageStandardInline', { allowAttributes: 'width' } );
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

		// Dedicated converter to propagate image's attribute to the image tag.
		editor.conversion.for( 'downcast' ).add( dispatcher =>
			dispatcher.on( `attribute:width:${ imageType }`, ( evt, data, conversionApi ) => {
				if ( !conversionApi.consumable.consume( data.item, evt.name ) ) {
					return;
				}

				const viewWriter = conversionApi.writer;
				const image = conversionApi.mapper.toViewElement( data.item );

				if ( data.attributeNewValue !== null ) {
					viewWriter.setStyle( 'width', data.attributeNewValue, image );
					viewWriter.addClass( 'image_resized', image );
				} else {
					viewWriter.removeStyle( 'width', image );
					viewWriter.removeClass( 'image_resized', image );
				}
			} )
		);

		editor.conversion.for( 'upcast' )
			.attributeToAttribute( {
				view: {
					name: imageType === 'imageStandardBlock' ? 'image' : 'image',
					styles: {
						width: /.+/
					}
				},
				model: {
					key: 'width',
					value: viewElement => viewElement.getStyle( 'width' )
				}
			} );
	}
}
