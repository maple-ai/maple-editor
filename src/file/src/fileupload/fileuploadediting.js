/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module file/fileupload/fileuploadediting
 */

import { Plugin } from 'ckeditor5/src/core';

import { UpcastWriter } from 'ckeditor5/src/engine';

import { Notification } from 'ckeditor5/src/ui';
import { ClipboardPipeline } from 'ckeditor5/src/clipboard';
import { FileRepository } from 'ckeditor5/src/upload';
import { env } from 'ckeditor5/src/utils';

import FileUtils from '../fileutils';
import UploadFileCommand from './uploadfilecommand';
import { fetchLocalFile, isLocalFile } from './utils';
import { createFileTypeRegExp } from './utils';

/**
 * The editing part of the file upload feature. It registers the `'uploadFile'` command
 * and the `fileUpload` command as an aliased name.
 *
 * When an file is uploaded, it fires the {@link ~FileUploadEditing#event:uploadComplete `uploadComplete`} event
 * that allows adding custom attributes to the {@link module:engine/model/element~Element file element}.
 *
 * @extends module:core/plugin~Plugin
 */
export default class FileUploadEditing extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ FileRepository, Notification, ClipboardPipeline, FileUtils ];
	}

	static get pluginName() {
		return 'FileUploadEditing';
	}

	/**
	 * @inheritDoc
	 */
	constructor( editor ) {
		super( editor );

		editor.config.define( 'file', {
			upload: {
				types: [ 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff', 'pdf' ]
			}
		} );

		/**
		 * An internal mapping of {@link module:upload/filerepository~FileLoader#id file loader UIDs} and
		 * model elements during the upload.
		 *
		 * Model element of the uploaded file can change, for instance, when {@link module:file/file/filetypecommand~FileTypeCommand}
		 * is executed as a result of adding caption or changing file style. As a result, the upload logic must keep track of the model
		 * element (reference) and resolve the upload for the correct model element (instead of the one that landed in the `$graveyard`
		 * after file type changed).
		 *
		 * @private
		 * @readonly
		 * @member {Map.<String,module:engine/model/element~Element>}
		 */
		this._uploadFileElements = new Map();
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;
		const doc = editor.model.document;
		const conversion = editor.conversion;
		const fileRepository = editor.plugins.get( FileRepository );
		const fileUtils = editor.plugins.get( 'FileUtils' );
		const fileTypes = createFileTypeRegExp( editor.config.get( 'file.upload.types' ) );
		const uploadFileCommand = new UploadFileCommand( editor );

		// Register `uploadFile` command and add `fileUpload` command as an alias for backward compatibility.
		editor.commands.add( 'uploadFile', uploadFileCommand );
		editor.commands.add( 'fileUpload', uploadFileCommand );

		// Register upcast converter for uploadId.
		conversion.for( 'upcast' )
			.attributeToAttribute( {
				view: {
					name: 'iframe',
					key: 'uploadId'
				},
				model: 'uploadId'
			} );

		// Handle pasted files.
		// For every file file, a new file loader is created and a placeholder file is
		// inserted into the content. Then, those files are uploaded once they appear in the model
		// (see Document#change listener below).
		this.listenTo( editor.editing.view.document, 'clipboardInput', ( evt, data ) => {
			// Skip if non empty HTML data is included.
			// https://github.com/ckeditor/ckeditor5-upload/issues/68
			if ( isHtmlIncluded( data.dataTransfer ) ) {
				return;
			}

			const files = Array.from( data.dataTransfer.files ).filter( file => {
				// See https://github.com/ckeditor/ckeditor5-file/pull/254.
				if ( !file ) {
					return false;
				}

				return fileTypes.test( file.type );
			} );

			if ( !files.length ) {
				return;
			}

			evt.stop();

			editor.model.change( writer => {
				// Set selection to paste target.
				if ( data.targetRanges ) {
					writer.setSelection( data.targetRanges.map( viewRange => editor.editing.mapper.toModelRange( viewRange ) ) );
				}

				// Upload files after the selection has changed in order to ensure the command's state is refreshed.
				editor.model.enqueueChange( () => {
					editor.execute( 'uploadFile', { file: files } );
				} );
			} );
		} );

		// Handle HTML pasted with files with base64 or blob sources.
		// For every file file, a new file loader is created and a placeholder file is
		// inserted into the content. Then, those files are uploaded once they appear in the model
		// (see Document#change listener below).
		this.listenTo( editor.plugins.get( 'ClipboardPipeline' ), 'inputTransformation', ( evt, data ) => {
			const fetchableFiles = Array.from( editor.editing.view.createRangeIn( data.content ) )
				.filter( value => isLocalFile( fileUtils, value.item ) && !value.item.getAttribute( 'uploadProcessed' ) )
				.map( value => { return { promise: fetchLocalFile( value.item ), fileElement: value.item }; } );

			if ( !fetchableFiles.length ) {
				return;
			}

			const writer = new UpcastWriter( editor.editing.view.document );

			for ( const fetchableFile of fetchableFiles ) {
				// Set attribute marking that the file was processed already.
				writer.setAttribute( 'uploadProcessed', true, fetchableFile.fileElement );

				const loader = fileRepository.createLoader( fetchableFile.promise );

				if ( loader ) {
					// writer.setAttribute( 'src', "https://viewer.maple.haus/" + fetchableFile.fileElement );
					writer.setAttribute( 'src', '', fetchableFile.fileElement );
					writer.setAttribute( 'uploadId', loader.id, fetchableFile.fileElement );
				}
			}
		} );

		// Prevents from the browser redirecting to the dropped file.
		editor.editing.view.document.on( 'dragover', ( evt, data ) => {
			data.preventDefault();
		} );

		// Upload placeholder files that appeared in the model.
		doc.on( 'change', () => {
			// Note: Reversing changes to start with insertions and only then handle removals. If it was the other way around,
			// loaders for **all** files that land in the $graveyard would abort while in fact only those that were **not** replaced
			// by other files should be aborted.
			const changes = doc.differ.getChanges( { includeChangesInGraveyard: true } ).reverse();
			const insertedFilesIds = new Set();

			for ( const entry of changes ) {
				if ( entry.type == 'insert' && entry.name != '$text' ) {
					const item = entry.position.nodeAfter;
					const isInsertedInGraveyard = entry.position.root.rootName == '$graveyard';

					for ( const fileElement of getFilesFromChangeItem( editor, item ) ) {
						// Check if the file element still has upload id.
						const uploadId = fileElement.getAttribute( 'uploadId' );

						if ( !uploadId ) {
							continue;
						}

						// Check if the file is loaded on this client.
						const loader = fileRepository.loaders.get( uploadId );

						if ( !loader ) {
							continue;
						}

						if ( isInsertedInGraveyard ) {
							// If the file was inserted to the graveyard for good (**not** replaced by another file),
							// only then abort the loading process.
							if ( !insertedFilesIds.has( uploadId ) ) {
								loader.abort();
							}
						} else {
							// Remember the upload id of the inserted file. If it acted as a replacement for another
							// file (which landed in the $graveyard), the related loader will not be aborted because
							// this is still the same file upload.
							insertedFilesIds.add( uploadId );

							// Keep the mapping between the upload ID and the file model element so the upload
							// can later resolve in the context of the correct model element. The model element could
							// change for the same upload if one file was replaced by another (e.g. file type was changed),
							// so this may also replace an existing mapping.
							this._uploadFileElements.set( uploadId, fileElement );

							if ( loader.status == 'idle' ) {
								// If the file was inserted into content and has not been loaded yet, start loading it.
								this._readAndUpload( loader );
							}
						}
					}
				}
			}
		} );

		// Set the default handler for feeding the file element with `src` and `srcset` attributes.
		this.on( 'uploadComplete', ( evt, { fileElement, data } ) => {
			const urls = data.urls ? data.urls : data;

			this.editor.model.change( writer => {

				let url = urls.default;
				// if (url) {
				// 	url = url.slice(0, -12);
				// 	
				// 	
				// }

				// +%281%29
				writer.setAttribute( 'src', "https://viewer.maple.haus/" + url, fileElement );
				writer.setAttribute( 'allowfullscreen', "", fileElement );
				writer.setAttribute( 'allowtransparency', "", fileElement );
				
				this._parseAndSetSrcsetAttributeOnFile( urls, fileElement, writer );
			} );
		}, { priority: 'low' } );
	}

	/**
	 * @inheritDoc
	 */
	afterInit() {
		const schema = this.editor.model.schema;

		// Setup schema to allow uploadId and uploadStatus for files.
		// Wait for FileBlockEditing or FileInlineEditing to register their elements first,
		// that's why doing this in afterInit() instead of init().

		if ( this.editor.plugins.has( 'FileInlineEditing' ) ) {
			schema.extend( 'fileInline', {
				allowAttributes: [ 'uploadId', 'uploadStatus' ]
			} );
		}
		
		if ( this.editor.plugins.has( 'FileBlockEditing' ) ) {
			schema.extend( 'fileBlock', {
				allowAttributes: [ 'uploadId', 'uploadStatus' ]
			} );
		}
	}

	/**
	 * Reads and uploads an file.
	 *
	 * The file is read from the disk and as a Base64-encoded string it is set temporarily to
	 * `file[src]`. When the file is successfully uploaded, the temporary data is replaced with the target
	 * file's URL (the URL to the uploaded file on the server).
	 *
	 * @protected
	 * @param {module:upload/filerepository~FileLoader} loader
	 * @returns {Promise}
	 */
	_readAndUpload( loader ) {
		const editor = this.editor;
		const model = editor.model;
		const t = editor.locale.t;
		const fileRepository = editor.plugins.get( FileRepository );
		const notification = editor.plugins.get( Notification );
		const fileUtils = editor.plugins.get( 'FileUtils' );
		const fileUploadElements = this._uploadFileElements;

		model.enqueueChange( { isUndoable: false }, writer => {
			writer.setAttribute( 'uploadStatus', 'reading', fileUploadElements.get( loader.id ) );
		} );

		return loader.read()
			.then( () => {
				const promise = loader.upload();
				const fileElement = fileUploadElements.get( loader.id );

				// Force re–paint in Safari. Without it, the file will display with a wrong size.
				// https://github.com/ckeditor/ckeditor5/issues/1975
				/* istanbul ignore next */
				if ( env.isSafari ) {
					const viewFigure = editor.editing.mapper.toViewElement( fileElement );
					const viewImg = fileUtils.findViewImgElement( viewFigure );

					editor.editing.view.once( 'render', () => {
						// Early returns just to be safe. There might be some code ran
						// in between the outer scope and this callback.
						if ( !viewImg.parent ) {
							return;
						}

						const domFigure = editor.editing.view.domConverter.mapViewToDom( viewImg.parent );

						if ( !domFigure ) {
							return;
						}

						const originalDisplay = domFigure.style.display;

						domFigure.style.display = 'none';

						// Make sure this line will never be removed during minification for having "no effect".
						domFigure._ckHack = domFigure.offsetHeight;

						domFigure.style.display = originalDisplay;
					} );
				}

				model.enqueueChange( { isUndoable: false }, writer => {
					writer.setAttribute( 'uploadStatus', 'uploading', fileElement );
				} );

				return promise;
			} )
			.then( data => {
				model.enqueueChange( { isUndoable: false }, writer => {
					const fileElement = fileUploadElements.get( loader.id );

					writer.setAttribute( 'uploadStatus', 'complete', fileElement );

					/**
					 * An event fired when an file is uploaded. You can hook into this event to provide
					 * custom attributes to the {@link module:engine/model/element~Element file element} based on the data from
					 * the server.
					 *
					 * 		const fileUploadEditing = editor.plugins.get( 'FileUploadEditing' );
					 *
					 * 		fileUploadEditing.on( 'uploadComplete', ( evt, { data, fileElement } ) => {
					 * 			editor.model.change( writer => {
					 * 				writer.setAttribute( 'someAttribute', 'foo', fileElement );
					 * 			} );
					 * 		} );
					 *
					 * You can also stop the default handler that sets the `src` and `srcset` attributes
					 * if you want to provide custom values for these attributes.
					 *
					 * 		fileUploadEditing.on( 'uploadComplete', ( evt, { data, fileElement } ) => {
					 * 			evt.stop();
					 * 		} );
					 *
					 * **Note**: This event is fired by the {@link module:file/fileupload/fileuploadediting~FileUploadEditing} plugin.
					 *
					 * @event uploadComplete
					 * @param {Object} data The `uploadComplete` event data.
					 * @param {Object} data.data The data coming from the upload adapter.
					 * @param {module:engine/model/element~Element} data.fileElement The
					 * model {@link module:engine/model/element~Element file element} that can be customized.
					 */
					this.fire( 'uploadComplete', { data, fileElement } );
				} );

				clean();
			} )
			.catch( error => {
				// If status is not 'error' nor 'aborted' - throw error because it means that something else went wrong,
				// it might be generic error and it would be real pain to find what is going on.
				if ( loader.status !== 'error' && loader.status !== 'aborted' ) {
					throw error;
				}

				// Might be 'aborted'.
				if ( loader.status == 'error' && error ) {
					notification.showWarning( error, {
						title: t( 'Upload failed' ),
						namespace: 'upload'
					} );
				}

				// Permanently remove file from insertion batch.
				model.enqueueChange( { isUndoable: false }, writer => {
					writer.remove( fileUploadElements.get( loader.id ) );
				} );

				clean();
			} );

		function clean() {
			model.enqueueChange( { isUndoable: false }, writer => {
				const fileElement = fileUploadElements.get( loader.id );

				writer.removeAttribute( 'uploadId', fileElement );
				writer.removeAttribute( 'uploadStatus', fileElement );

				fileUploadElements.delete( loader.id );
			} );

			fileRepository.destroyLoader( loader );
		}
	}

	/**
	 * Creates the `srcset` attribute based on a given file upload response and sets it as an attribute to a specific file element.
	 *
	 * @protected
	 * @param {Object} data Data object from which `srcset` will be created.
	 * @param {module:engine/model/element~Element} file The file element on which the `srcset` attribute will be set.
	 * @param {module:engine/model/writer~Writer} writer
	 */
	_parseAndSetSrcsetAttributeOnFile( data, file, writer ) {
		// Srcset attribute for responsive files support.
		let maxWidth = 0;

		const srcsetAttribute = Object.keys( data )
			// Filter out keys that are not integers.
			.filter( key => {
				const width = parseInt( key, 10 );

				if ( !isNaN( width ) ) {
					maxWidth = Math.max( maxWidth, width );

					return true;
				}
			} )

			// Convert each key to srcset entry.
			.map( key => `${ data[ key ] } ${ key }w` )

			// Join all entries.
			.join( ', ' );

		if ( srcsetAttribute != '' ) {
			writer.setAttribute( 'srcset', {
				data: srcsetAttribute,
				width: maxWidth
			}, file );
		}
	}
}

// Returns `true` if non-empty `text/html` is included in the data transfer.
//
// @param {module:clipboard/datatransfer~DataTransfer} dataTransfer
// @returns {Boolean}
export function isHtmlIncluded( dataTransfer ) {
	return Array.from( dataTransfer.types ).includes( 'text/html' ) && dataTransfer.getData( 'text/html' ) !== '';
}

function getFilesFromChangeItem( editor, item ) {
	const fileUtils = editor.plugins.get( 'FileUtils' );

	return Array.from( editor.model.createRangeOn( item ) )
		.filter( value => fileUtils.isFile( value.item ) )
		.map( value => value.item );
}
