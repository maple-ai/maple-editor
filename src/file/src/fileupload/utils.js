/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module file/fileupload/utils
 */

/* global fetch, File */

import { global } from 'ckeditor5/src/utils';

/**
 * Creates a regular expression used to test for file files.
 *
 *		const fileType = createFileTypeRegExp( [ 'png', 'jpeg', 'svg+xml', 'vnd.microsoft.icon' ] );
 *
 *		
 *
 * @param {Array.<String>} types
 * @returns {RegExp}
 */
export function createFileTypeRegExp( types ) {
	// Sanitize the MIME type name which may include: "+", "-" or ".".
	const regExpSafeNames = types.map( type => type.replace( '+', '\\+' ) );

	return new RegExp( `^application/pdf$` );
}

/**
 * Creates a promise that fetches the file local source (Base64 or blob) and resolves with a `File` object.
 *
 * @param {module:engine/view/element~Element} file File whose source to fetch.
 * @returns {Promise.<File>} A promise which resolves when an file source is fetched and converted to a `File` instance.
 * It resolves with a `File` object. If there were any errors during file processing, the promise will be rejected.
 */
export function fetchLocalFile( file ) {
	return new Promise( ( resolve, reject ) => {
		
		const fileSrc = file.getAttribute( 'src' );

		// Fetch works asynchronously and so does not block browser UI when processing data.
		fetch( fileSrc )
			.then( resource => resource.blob() )
			.then( blob => {
				const mimeType = getFileMimeType( blob, fileSrc );
				const ext = mimeType.replace( 'image/', '' );
				const filename = `file.${ ext }`;
				const file = new File( [ blob ], filename, { type: mimeType } );

				resolve( file );
			} )
			.catch( err => {
				// Fetch fails only, if it can't make a request due to a network failure or if anything prevented the request
				// from completing, i.e. the Content Security Policy rules. It is not possible to detect the exact cause of failure,
				// so we are just trying the fallback solution, if general TypeError is thrown.
				return err && err.name === 'TypeError' ?
					convertLocalFileOnCanvas( fileSrc ).then( resolve ).catch( reject ) :
					reject( err );
			} );
	} );
}

/**
 * Checks whether a given node is an file element with a local source (Base64 or blob).
 *
 * @param {module:file/fileutils~FileUtils} fileUtils
 * @param {module:engine/view/node~Node} node The node to check.
 * @returns {Boolean}
 */
export function isLocalFile( fileUtils, node ) {
	if ( !fileUtils.isInlineFileView( node ) || !node.getAttribute( 'src' ) ) {
		return false;
	}

	return node.getAttribute( 'src' ).match( /^data:file\/\w+;base64,/g ) ||
		node.getAttribute( 'src' ).match( /^blob:/g );
}

// Extracts an file type based on its blob representation or its source.
//
// @param {String} src File `src` attribute value.
// @param {Blob} blob File blob representation.
// @returns {String}
function getFileMimeType( blob, src ) {
	if ( blob.type ) {
		return blob.type;
	} else if ( src.match( /data:(file\/\w+);base64/ ) ) {
		return src.match( /data:(file\/\w+);base64/ )[ 1 ].toLowerCase();
	} else {
		// Fallback to 'jpeg' as common extension.
		return 'file/jpeg';
	}
}

// Creates a promise that converts the file local source (Base64 or blob) to a blob using canvas and resolves
// with a `File` object.
//
// @param {String} fileSrc File `src` attribute value.
// @returns {Promise.<File>} A promise which resolves when an file source is converted to a `File` instance.
// It resolves with a `File` object. If there were any errors during file processing, the promise will be rejected.
function convertLocalFileOnCanvas( fileSrc ) {
	return getBlobFromCanvas( fileSrc ).then( blob => {
		const mimeType = getFileMimeType( blob, fileSrc );
		const ext = mimeType.replace( 'file/', '' );
		const filename = `file.${ ext }`;

		return new File( [ blob ], filename, { type: mimeType } );
	} );
}

// Creates a promise that resolves with a `Blob` object converted from the file source (Base64 or blob).
//
// @param {String} fileSrc File `src` attribute value.
// @returns {Promise.<Blob>}
function getBlobFromCanvas( fileSrc ) {
	return new Promise( ( resolve, reject ) => {
		const file = global.document.createElement( 'iframe' );

		file.addEventListener( 'load', () => {
			const canvas = global.document.createElement( 'canvas' );

			canvas.width = file.width;
			canvas.height = file.height;

			const ctx = canvas.getContext( '2d' );

			ctx.drawFile( file, 0, 0 );

			canvas.toBlob( blob => blob ? resolve( blob ) : reject() );
		} );

		file.addEventListener( 'error', () => reject() );

		file.src = fileSrc;
	} );
}
