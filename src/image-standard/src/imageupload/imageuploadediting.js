/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module image/imageupload/imageuploadediting
 */

import { Plugin } from 'ckeditor5/src/core';

import { UpcastWriter } from 'ckeditor5/src/engine';

import { Notification } from 'ckeditor5/src/ui';
import { ClipboardPipeline } from 'ckeditor5/src/clipboard';
import { FileRepository } from 'ckeditor5/src/upload';
import { env } from 'ckeditor5/src/utils';

import ImageStandardUtils from '../imageutils';
import UploadImageStandardCommand from './uploadimagecommand';
import { fetchLocalImageStandard, isLocalImageStandard } from '../../src/imageupload/utils';
import { createImageStandardTypeRegExp } from './utils';

/**
 * The editing part of the image upload feature. It registers the `'uploadImageStandard'` command
 * and the `imageStandardUpload` command as an aliased name.
 *
 * When an image is uploaded, it fires the {@link ~ImageStandardUploadEditing#event:uploadComplete `uploadComplete`} event
 * that allows adding custom attributes to the {@link module:engine/model/element~Element image element}.
 *
 * @extends module:core/plugin~Plugin
 */
export default class ImageStandardUploadEditing extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ FileRepository, Notification, ClipboardPipeline, ImageStandardUtils ];
	}

	static get pluginName() {
		return 'ImageStandardUploadEditing';
	}

	/**
	 * @inheritDoc
	 */
	constructor( editor ) {
		super( editor );

		editor.config.define( 'imageStandard', {
			upload: {
				types: [ 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff' ]
			}
		} );

		/**
		 * An internal mapping of {@link module:upload/filerepository~FileLoader#id file loader UIDs} and
		 * model elements during the upload.
		 *
		 * Model element of the uploaded image can change, for instance, when {@link module:image/image/imagetypecommand~ImageStandardTypeCommand}
		 * is executed as a result of adding caption or changing image style. As a result, the upload logic must keep track of the model
		 * element (reference) and resolve the upload for the correct model element (instead of the one that landed in the `$graveyard`
		 * after image type changed).
		 *
		 * @private
		 * @readonly
		 * @member {Map.<String,module:engine/model/element~Element>}
		 */
		this._uploadImageStandardElements = new Map();
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;
		const doc = editor.model.document;
		const conversion = editor.conversion;
		const fileRepository = editor.plugins.get( FileRepository );
		const imageUtils = editor.plugins.get( 'ImageStandardUtils' );
		const imageTypes = createImageStandardTypeRegExp( editor.config.get( 'image.upload.types' ) );
		const uploadImageStandardCommand = new UploadImageStandardCommand( editor );

		// Register `uploadImageStandard` command and add `imageStandardUpload` command as an alias for backward compatibility.
		editor.commands.add( 'uploadImageStandard', uploadImageStandardCommand );
		editor.commands.add( 'imageStandardUpload', uploadImageStandardCommand );

		// Register upcast converter for uploadId.
		conversion.for( 'upcast' )
			.attributeToAttribute( {
				view: {
					name: 'image',
					key: 'uploadId'
				},
				model: 'uploadId'
			} );

		// Handle pasted images.
		// For every image file, a new file loader is created and a placeholder image is
		// inserted into the content. Then, those images are uploaded once they appear in the model
		// (see Document#change listener below).
		this.listenTo( editor.editing.view.document, 'clipboardInput', ( evt, data ) => {
			// Skip if non empty HTML data is included.
			// https://github.com/ckeditor/ckeditor5-upload/issues/68
			if ( isHtmlIncluded( data.dataTransfer ) ) {
				return;
			}

			const images = Array.from( data.dataTransfer.files ).filter( file => {
				// See https://github.com/ckeditor/ckeditor5-image/pull/254.
				if ( !file ) {
					return false;
				}

				return imageTypes.test( file.type );
			} );

			if ( !images.length ) {
				return;
			}

			evt.stop();

			editor.model.change( writer => {
				// Set selection to paste target.
				if ( data.targetRanges ) {
					writer.setSelection( data.targetRanges.map( viewRange => editor.editing.mapper.toModelRange( viewRange ) ) );
				}

				// Upload images after the selection has changed in order to ensure the command's state is refreshed.
				editor.model.enqueueChange( () => {
					editor.execute( 'uploadImageStandard', { file: images } );
				} );
			} );
		} );

		// Handle HTML pasted with images with base64 or blob sources.
		// For every image file, a new file loader is created and a placeholder image is
		// inserted into the content. Then, those images are uploaded once they appear in the model
		// (see Document#change listener below).
		this.listenTo( editor.plugins.get( 'ClipboardPipeline' ), 'inputTransformation', ( evt, data ) => {
			const fetchableImageStandards = Array.from( editor.editing.view.createRangeIn( data.content ) )
				.filter( value => isLocalImageStandard( imageUtils, value.item ) && !value.item.getAttribute( 'uploadProcessed' ) )
				.map( value => { return { promise: fetchLocalImageStandard( value.item ), imageElement: value.item }; } );

			if ( !fetchableImageStandards.length ) {
				return;
			}

			const writer = new UpcastWriter( editor.editing.view.document );

			for ( const fetchableImageStandard of fetchableImageStandards ) {
				// Set attribute marking that the image was processed already.
				writer.setAttribute( 'uploadProcessed', true, fetchableImageStandard.imageElement );

				const loader = fileRepository.createLoader( fetchableImageStandard.promise );

				if ( loader ) {
					writer.setAttribute( 'src', '', fetchableImageStandard.imageElement );
					writer.setAttribute( 'uploadId', loader.id, fetchableImageStandard.imageElement );
				}
			}
		} );

		// Prevents from the browser redirecting to the dropped image.
		editor.editing.view.document.on( 'dragover', ( evt, data ) => {
			data.preventDefault();
		} );

		// Upload placeholder images that appeared in the model.
		doc.on( 'change', () => {
			// Note: Reversing changes to start with insertions and only then handle removals. If it was the other way around,
			// loaders for **all** images that land in the $graveyard would abort while in fact only those that were **not** replaced
			// by other images should be aborted.
			const changes = doc.differ.getChanges( { includeChangesInGraveyard: true } ).reverse();
			const insertedImageStandardsIds = new Set();

			for ( const entry of changes ) {
				if ( entry.type == 'insert' && entry.name != '$text' ) {
					const item = entry.position.nodeAfter;
					const isInsertedInGraveyard = entry.position.root.rootName == '$graveyard';

					for ( const imageElement of getImageStandardsFromChangeItem( editor, item ) ) {
						// Check if the image element still has upload id.
						const uploadId = imageElement.getAttribute( 'uploadId' );

						if ( !uploadId ) {
							continue;
						}

						// Check if the image is loaded on this client.
						const loader = fileRepository.loaders.get( uploadId );

						if ( !loader ) {
							continue;
						}

						if ( isInsertedInGraveyard ) {
							// If the image was inserted to the graveyard for good (**not** replaced by another image),
							// only then abort the loading process.
							if ( !insertedImageStandardsIds.has( uploadId ) ) {
								loader.abort();
							}
						} else {
							// Remember the upload id of the inserted image. If it acted as a replacement for another
							// image (which landed in the $graveyard), the related loader will not be aborted because
							// this is still the same image upload.
							insertedImageStandardsIds.add( uploadId );

							// Keep the mapping between the upload ID and the image model element so the upload
							// can later resolve in the context of the correct model element. The model element could
							// change for the same upload if one image was replaced by another (e.g. image type was changed),
							// so this may also replace an existing mapping.
							this._uploadImageStandardElements.set( uploadId, imageElement );

							if ( loader.status == 'idle' ) {
								// If the image was inserted into content and has not been loaded yet, start loading it.
								this._readAndUpload( loader );
							}
						}
					}
				}
			}
		} );

		// Set the default handler for feeding the image element with `src` and `srcset` attributes.
		this.on( 'uploadComplete', ( evt, { imageElement, data } ) => {
			const urls = data.urls ? data.urls : data;

			this.editor.model.change( writer => {
				// writer.setAttribute( 'src', urls.default, imageElement );
				// writer.setAttribute( 'src', "http://localhost:54898/tag?isEdit=true&url=" + encodeURIComponent(urls.default), imageElement );
				// writer.setAttribute( 'src', "https://tagger.maple.haus/tag?isEdit=true&url=" + encodeURIComponent(urls.default), imageElement );
				this._parseAndSetSrcsetAttributeOnImageStandard( urls, imageElement, writer );
			} );
		}, { priority: 'low' } );
	}

	/**
	 * @inheritDoc
	 */
	afterInit() {
		const schema = this.editor.model.schema;

		// Setup schema to allow uploadId and uploadStatus for images.
		// Wait for ImageStandardBlockEditing or ImageStandardInlineEditing to register their elements first,
		// that's why doing this in afterInit() instead of init().

		if ( this.editor.plugins.has( 'ImageStandardInlineEditing' ) ) {
			schema.extend( 'imageStandardInline', {
				allowAttributes: [ 'uploadId', 'uploadStatus' ]
			} );
		}
		
		if ( this.editor.plugins.has( 'ImageStandardBlockEditing' ) ) {
			schema.extend( 'imageStandardBlock', {
				allowAttributes: [ 'uploadId', 'uploadStatus' ]
			} );
		}
	}

	/**
	 * Reads and uploads an image.
	 *
	 * The image is read from the disk and as a Base64-encoded string it is set temporarily to
	 * `image[src]`. When the image is successfully uploaded, the temporary data is replaced with the target
	 * image's URL (the URL to the uploaded image on the server).
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
		const imageUtils = editor.plugins.get( 'ImageStandardUtils' );
		const imageStandardUploadElements = this._uploadImageStandardElements;

		model.enqueueChange( { isUndoable: false }, writer => {
			writer.setAttribute( 'uploadStatus', 'reading', imageStandardUploadElements.get( loader.id ) );
		} );

		return loader.read()
			.then( () => {
				const promise = loader.upload();
				const imageElement = imageStandardUploadElements.get( loader.id );

				// Force re–paint in Safari. Without it, the image will display with a wrong size.
				// https://github.com/ckeditor/ckeditor5/issues/1975
				/* istanbul ignore next */
				if ( env.isSafari ) {
					const viewFigure = editor.editing.mapper.toViewElement( imageElement );
					const viewImg = imageUtils.findViewImgElement( viewFigure );

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
					writer.setAttribute( 'uploadStatus', 'uploading', imageElement );
				} );

				return promise;
			} )
			.then( data => {
				model.enqueueChange( { isUndoable: false }, writer => {
					const imageElement = imageStandardUploadElements.get( loader.id );

					writer.setAttribute( 'uploadStatus', 'complete', imageElement );

					/**
					 * An event fired when an image is uploaded. You can hook into this event to provide
					 * custom attributes to the {@link module:engine/model/element~Element image element} based on the data from
					 * the server.
					 *
					 * 		const imageStandardUploadEditing = editor.plugins.get( 'ImageStandardUploadEditing' );
					 *
					 * 		imageStandardUploadEditing.on( 'uploadComplete', ( evt, { data, imageElement } ) => {
					 * 			editor.model.change( writer => {
					 * 				writer.setAttribute( 'someAttribute', 'foo', imageElement );
					 * 			} );
					 * 		} );
					 *
					 * You can also stop the default handler that sets the `src` and `srcset` attributes
					 * if you want to provide custom values for these attributes.
					 *
					 * 		imageStandardUploadEditing.on( 'uploadComplete', ( evt, { data, imageElement } ) => {
					 * 			evt.stop();
					 * 		} );
					 *
					 * **Note**: This event is fired by the {@link module:image/imageupload/imageuploadediting~ImageStandardUploadEditing} plugin.
					 *
					 * @event uploadComplete
					 * @param {Object} data The `uploadComplete` event data.
					 * @param {Object} data.data The data coming from the upload adapter.
					 * @param {module:engine/model/element~Element} data.imageElement The
					 * model {@link module:engine/model/element~Element image element} that can be customized.
					 */
					this.fire( 'uploadComplete', { data, imageElement } );
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

				// Permanently remove image from insertion batch.
				model.enqueueChange( { isUndoable: false }, writer => {
					writer.remove( imageStandardUploadElements.get( loader.id ) );
				} );

				clean();
			} );

		function clean() {
			model.enqueueChange( { isUndoable: false }, writer => {
				const imageElement = imageStandardUploadElements.get( loader.id );

				writer.removeAttribute( 'uploadId', imageElement );
				writer.removeAttribute( 'uploadStatus', imageElement );

				imageStandardUploadElements.delete( loader.id );
			} );

			fileRepository.destroyLoader( loader );
		}
	}

	/**
	 * Creates the `srcset` attribute based on a given file upload response and sets it as an attribute to a specific image element.
	 *
	 * @protected
	 * @param {Object} data Data object from which `srcset` will be created.
	 * @param {module:engine/model/element~Element} image The image element on which the `srcset` attribute will be set.
	 * @param {module:engine/model/writer~Writer} writer
	 */
	_parseAndSetSrcsetAttributeOnImageStandard( data, image, writer ) {
		// Srcset attribute for responsive images support.
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
			}, image );
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

function getImageStandardsFromChangeItem( editor, item ) {
	const imageUtils = editor.plugins.get( 'ImageStandardUtils' );

	return Array.from( editor.model.createRangeOn( item ) )
		.filter( value => imageUtils.isImageStandard( value.item ) )
		.map( value => value.item );
}
