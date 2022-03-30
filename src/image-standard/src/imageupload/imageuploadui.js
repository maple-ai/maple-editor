/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module image/imageupload/imageuploadui
 */

import { Plugin, icons } from 'ckeditor5/src/core';
import { FileDialogButtonView } from 'ckeditor5/src/upload';
import { createImageStandardTypeRegExp } from './utils';

/**
 * The image upload button plugin.
 *
 * For a detailed overview, check the {@glink features/images/image-upload/image-upload ImageStandard upload feature} documentation.
 *
 * Adds the `'uploadImageStandard'` button to the {@link module:ui/componentfactory~ComponentFactory UI component factory}
 * and also the `imageStandardUpload` button as an alias for backward compatibility.
 *
 * @extends module:core/plugin~Plugin
 */
export default class ImageStandardUploadUI extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'ImageStandardUploadUI';
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;
		const t = editor.t;
		const componentCreator = locale => {
			const view = new FileDialogButtonView( locale );
			const command = editor.commands.get( 'uploadImageStandard' );
			const imageTypes = editor.config.get( 'image.upload.types' );
			const imageTypesRegExp = createImageStandardTypeRegExp( imageTypes );

			view.set( {
				acceptedType: imageTypes.map( type => `image/${ type }` ).join( ',' ),
				allowMultipleFiles: true
			} );

			view.buttonView.set( {
				label: t( 'Insert image' ),
				icon: icons.image,
				tooltip: true
			} );

			view.buttonView.bind( 'isEnabled' ).to( command );

			view.on( 'done', ( evt, files ) => {
				const imagesToUpload = Array.from( files ).filter( file => imageTypesRegExp.test( file.type ) );

				if ( imagesToUpload.length ) {
					editor.execute( 'uploadImageStandard', { file: imagesToUpload } );
				}
			} );

			return view;
		};

		// Setup `uploadImageStandard` button and add `imageStandardUpload` button as an alias for backward compatibility.
		editor.ui.componentFactory.add( 'uploadImageStandard', componentCreator );
		editor.ui.componentFactory.add( 'imageStandardUpload', componentCreator );
	}
}
