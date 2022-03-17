/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module file/fileupload/fileuploadui
 */

import { Plugin, icons } from 'ckeditor5/src/core';
import { FileDialogButtonView } from 'ckeditor5/src/upload';
import { createFileTypeRegExp } from './utils';

/**
 * The file upload button plugin.
 *
 * For a detailed overview, check the {@glink features/files/file-upload/file-upload File upload feature} documentation.
 *
 * Adds the `'uploadFile'` button to the {@link module:ui/componentfactory~ComponentFactory UI component factory}
 * and also the `fileUpload` button as an alias for backward compatibility.
 *
 * @extends module:core/plugin~Plugin
 */
export default class FileUploadUI extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'FileUploadUI';
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;
		const t = editor.t;
		const componentCreator = locale => {
			const view = new FileDialogButtonView( locale );
			const command = editor.commands.get( 'uploadFile' );
			const fileTypes = editor.config.get( 'file.upload.types' );
			const fileTypesRegExp = createFileTypeRegExp( fileTypes );

			view.set( {
				acceptedType: 'application/pdf',
				allowMultipleFiles: true
			} );

			view.buttonView.set( {
				label: t( 'Insert file' ),
				icon: `
				<svg class="svg-icon" style="width: 1em; height: 1em;vertical-align: middle;fill: currentColor;overflow: hidden;" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M192 384h640a42.666667 42.666667 0 0 1 42.666667 42.666667v362.666666a42.666667 42.666667 0 0 1-42.666667 42.666667H192v106.666667a21.333333 21.333333 0 0 0 21.333333 21.333333h725.333334a21.333333 21.333333 0 0 0 21.333333-21.333333V308.821333L949.909333 298.666667h-126.528A98.048 98.048 0 0 1 725.333333 200.618667V72.661333L716.714667 64H213.333333a21.333333 21.333333 0 0 0-21.333333 21.333333v298.666667zM128 832H42.666667a42.666667 42.666667 0 0 1-42.666667-42.666667V426.666667a42.666667 42.666667 0 0 1 42.666667-42.666667h85.333333V85.333333a85.333333 85.333333 0 0 1 85.333333-85.333333h530.026667L1024 282.453333V938.666667a85.333333 85.333333 0 0 1-85.333333 85.333333H213.333333a85.333333 85.333333 0 0 1-85.333333-85.333333v-106.666667zM88.469333 472.490667V746.666667h44.928v-105.216h67.968c66.816 0 100.224-28.416 100.224-84.864 0-56.064-33.408-84.096-99.456-84.096H88.469333z m44.928 38.4h65.28c19.584 0 34.176 3.456 43.392 10.752 9.216 6.912 14.208 18.432 14.208 34.944 0 16.512-4.608 28.416-13.824 35.712-9.216 6.912-23.808 10.752-43.776 10.752h-65.28v-92.16z m206.592-38.4V746.666667h100.224c44.544 0 77.952-12.288 100.992-36.864 21.888-23.424 33.024-56.832 33.024-100.224 0-43.776-11.136-77.184-33.024-100.224-23.04-24.576-56.448-36.864-100.992-36.864h-100.224z m44.928 38.4h46.848c34.176 0 59.136 7.68 74.88 23.424 15.36 15.36 23.04 40.704 23.04 75.264 0 33.792-7.68 58.752-23.04 74.88-15.744 15.744-40.704 23.808-74.88 23.808h-46.848v-197.376z m231.552-38.4V746.666667h44.928v-121.344h134.016v-38.4h-134.016v-76.032h142.08v-38.4h-187.008z" fill="#EA4318" /></svg>
				`,
				tooltip: true
			} );

			view.buttonView.bind( 'isEnabled' ).to( command );

			view.on( 'done', ( evt, files ) => {
				const filesToUpload = Array.from( files ).filter( file => fileTypesRegExp.test( file.type ) );

				if ( filesToUpload.length ) {
					editor.execute( 'uploadFile', { file: filesToUpload } );
				}
			} );

			return view;
		};

		// Setup `uploadFile` button and add `fileUpload` button as an alias for backward compatibility.
		editor.ui.componentFactory.add( 'uploadFile', componentCreator );
		editor.ui.componentFactory.add( 'fileUpload', componentCreator );
	}
}
