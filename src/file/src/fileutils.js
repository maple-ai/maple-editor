/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module file/fileutils
 */

import { Plugin } from 'ckeditor5/src/core';
import { findOptimalInsertionRange, isWidget, toWidget } from 'ckeditor5/src/widget';
import { determineFileTypeForInsertionAtSelection } from './file/utils';

/**
 * A set of helpers related to files.
 *
 * @extends module:core/plugin~Plugin
 */
export default class FileUtils extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'FileUtils';
	}

	/**
	 * Checks if the provided model element is an `file` or `fileInline`.
	 *
	 * @param {module:engine/model/element~Element} modelElement
	 * @returns {Boolean}
	 */
	isFile( modelElement ) {
		return this.isInlineFile( modelElement ) || this.isBlockFile( modelElement );
	}

	/**
	 * Checks if the provided view element represents an inline file.
	 *
	 * Also, see {@link module:file/fileutils~FileUtils#isFileWidget}.
	 *
	 * @param {module:engine/view/element~Element} element
	 * @returns {Boolean}
	 */
	isInlineFileView( element ) {
		return !!element && element.is( 'element', 'iframe' );
	}

	/**
	 * Checks if the provided view element represents a block file.
	 *
	 * Also, see {@link module:file/fileutils~FileUtils#isFileWidget}.
	 *
	 * @param {module:engine/view/element~Element} element
	 * @returns {Boolean}
	 */
	isBlockFileView( element ) {
		return !!element && element.is( 'element', 'figure' ) && element.hasClass( 'file' );
	}

	/**
	 * Handles inserting single file. This method unifies file insertion using {@link module:widget/utils~findOptimalInsertionRange}
	 * method.
	 *
	 *		const fileUtils = editor.plugins.get( 'FileUtils' );
	 *
	 *		fileUtils.insertFile( { src: 'path/to/file.jpg' } );
	 *
	 * @param {Object} [attributes={}] Attributes of the inserted file.
	 * This method filters out the attributes which are disallowed by the {@link module:engine/model/schema~Schema}.
	 * @param {module:engine/model/selection~Selectable} [selectable] Place to insert the file. If not specified,
	 * the {@link module:widget/utils~findOptimalInsertionRange} logic will be applied for the block files
	 * and `model.document.selection` for the inline files.
	 *
	 * **Note**: If `selectable` is passed, this helper will not be able to set selection attributes (such as `linkHref`)
	 * and apply them to the new file. In this case, make sure all selection attributes are passed in `attributes`.
	 *
	 * @param {'fileBlock'|'fileInline'} [fileType] File type of inserted file. If not specified,
	 * it will be determined automatically depending of editor config or place of the insertion.
	 * @return {module:engine/view/element~Element|null} The inserted model file element.
	 */

	 insertFile( attributes = {}, selectable = null, fileType = null ) {
		
		const editor = this.editor;
		const model = editor.model;
		const selection = model.document.selection;

		// fileType = determinFileTypeForInsertion( editor, selectable || selection, fileType );

		// Mix declarative attributes with selection attributes because the new file should "inherit"
		// the latter for best UX. For instance, inline files inserted into existing links
		// should not split them. To do that, they need to have "linkHref" inherited from the selection.
		attributes = {
			...Object.fromEntries( selection.getAttributes() ),
			...attributes
		};

		for ( const attributeName in attributes ) {
			if ( !model.schema.checkAttribute( 'fileInline', attributeName ) ) {
				delete attributes[ attributeName ];
			}
		}

		return model.change( writer => {
			// const fileElement = writer.createElement( fileType, attributes );
			// 
			// 

			// If we want to insert a block file (for whatever reason) then we don't want to split text blocks.
			// This applies only when we don't have the selectable specified (i.e., we insert multiple block files at once).
			// if ( !selectable && fileType != 'fileInline' ) {
			// 	selectable = findOptimalInsertionRange( selection, model );
			// }

			// model.insertContent( fileElement, selectable );


			

			// const fileElement = writer.createElement( 'fileBlock', attributes );
			// model.insertContent( fileElement, selectable );


			const fileElement2 = writer.createElement( 'fileInline', attributes );
			model.insertContent( fileElement2, selectable );
			

			const position = selection.getFirstPosition();
			
			

			const { end: positionAfter } = model.insertContent( writer.createText( ' ' ), position );
			writer.setSelection( positionAfter );
			

			// const emptyElement = writer.createEmptyElement( 'iframe' );
			// writer.createContainerElement( 'span', { class: 'file-inline' }, { isAllowedInsideAttributeElement: true } );
			// writer.insert( writer.createPositionAt( container, 0 ), emptyElement );

			// Inserting an file might've failed due to schema regulations.
			// if ( fileElement.parent ) {
			// 	writer.setSelection( fileElement, 'on' );

			// 	return fileElement;
			// }

			return null;
		} );
	}


	insertFile( attributes = {}, selectable = null, fileType = null ) {
		
		const editor = this.editor;
		const model = editor.model;
		const selection = model.document.selection;

		fileType = determineFileTypeForInsertion( editor, selectable || selection, fileType );

		// Mix declarative attributes with selection attributes because the new file should "inherit"
		// the latter for best UX. For instance, inline files inserted into existing links
		// should not split them. To do that, they need to have "linkHref" inherited from the selection.
		attributes = {
			...Object.fromEntries( selection.getAttributes() ),
			...attributes
		};

		for ( const attributeName in attributes ) {
			if ( !model.schema.checkAttribute( fileType, attributeName ) ) {
				delete attributes[ attributeName ];
			}
		}

		
		
		return model.change( writer => {
			const fileElement = writer.createElement( fileType, attributes );

			// If we want to insert a block file (for whatever reason) then we don't want to split text blocks.
			// This applies only when we don't have the selectable specified (i.e., we insert multiple block files at once).
			if ( !selectable && fileType != 'fileInline' ) {
				selectable = findOptimalInsertionRange( selection, model );
			}

			model.insertContent( fileElement, selectable );

			const position = selection.getFirstPosition();
			const { end: positionAfter } = model.insertContent( writer.createText( ' ' ), position );
			writer.setSelection( positionAfter );
			
			// Inserting an file might've failed due to schema regulations.
			if ( fileElement.parent ) {
				writer.setSelection( fileElement, 'on' );

				return fileElement;
			}

			return null;
		} );
	}

	/**
	 * Returns an file widget editing view element if one is selected or is among the selection's ancestors.
	 *
	 * @protected
	 * @param {module:engine/view/selection~Selection|module:engine/view/documentselection~DocumentSelection} selection
	 * @returns {module:engine/view/element~Element|null}
	 */
	getClosestSelectedFileWidget( selection ) {
		const viewElement = selection.getSelectedElement();

		if ( viewElement && this.isFileWidget( viewElement ) ) {
			return viewElement;
		}

		let parent = selection.getFirstPosition().parent;

		while ( parent ) {
			if ( parent.is( 'element' ) && this.isFileWidget( parent ) ) {
				return parent;
			}

			parent = parent.parent;
		}

		return null;
	}

	/**
	 * Returns a file model element if one is selected or is among the selection's ancestors.
	 *
	 * @param {module:engine/model/selection~Selection|module:engine/model/documentselection~DocumentSelection} selection
	 * @returns {module:engine/model/element~Element|null}
	 */
	getClosestSelectedFileElement( selection ) {
		const selectedElement = selection.getSelectedElement();

		return this.isFile( selectedElement ) ? selectedElement : selection.getFirstPosition().findAncestor( 'fileBlock' );
	}

	/**
	 * Checks if file can be inserted at current model selection.
	 *
	 * @protected
	 * @returns {Boolean}
	 */
	isFileAllowed() {
		const model = this.editor.model;
		const selection = model.document.selection;

		return isFileAllowedInParent( this.editor, selection ) && isNotInsideFile( selection );
	}

	/**
	 * Converts a given {@link module:engine/view/element~Element} to an file widget:
	 * * Adds a {@link module:engine/view/element~Element#_setCustomProperty custom property} allowing to recognize the file widget
	 * element.
	 * * Calls the {@link module:widget/utils~toWidget} function with the proper element's label creator.
	 *
	 * @protected
	 * @param {module:engine/view/element~Element} viewElement
	 * @param {module:engine/view/downcastwriter~DowncastWriter} writer An instance of the view writer.
	 * @param {String} label The element's label. It will be concatenated with the file `alt` attribute if one is present.
	 * @returns {module:engine/view/element~Element}
	 */
	toFileWidget( viewElement, writer, label ) {
		writer.setCustomProperty( 'file', true, viewElement );

		const labelCreator = () => {
			const iframeElement = this.findViewImgElement( viewElement );
			const altText = iframeElement.getAttribute( 'alt' );

			return altText ? `${ altText } ${ label }` : label;
		};

		return toWidget( viewElement, writer, { label: labelCreator } );
	}

	/**
	 * Checks if a given view element is an file widget.
	 *
	 * @protected
	 * @param {module:engine/view/element~Element} viewElement
	 * @returns {Boolean}
	 */
	isFileWidget( viewElement ) {
		return !!viewElement.getCustomProperty( 'file' ) && isWidget( viewElement );
	}

	/**
	 * Checks if the provided model element is an `file`.
	 *
	 * @param {module:engine/model/element~Element} modelElement
	 * @returns {Boolean}
	 */
	isBlockFile( modelElement ) {
		return !!modelElement && modelElement.is( 'element', 'fileBlock' );
	}

	/**
	 * Checks if the provided model element is an `fileInline`.
	 *
	 * @param {module:engine/model/element~Element} modelElement
	 * @returns {Boolean}
	 */
	isInlineFile( modelElement ) {
		return !!modelElement && modelElement.is( 'element', 'fileInline' );
	}

	/**
	 * Get the view `<iframe>` from another view element, e.g. a widget (`<figure class="file">`), a link (`<a>`).
	 *
	 * The `<iframe>` can be located deep in other elements, so this helper performs a deep tree search.
	 *
	 * @param {module:engine/view/element~Element} figureView
	 * @returns {module:engine/view/element~Element}
	 */
	findViewImgElement( figureView ) {
		if ( this.isInlineFileView( figureView ) ) {
			return figureView;
		}

		const editingView = this.editor.editing.view;

		for ( const { item } of editingView.createRangeIn( figureView ) ) {
			if ( this.isInlineFileView( item ) ) {
				return item;
			}
		}
	}
}

// Checks if file is allowed by schema in optimal insertion parent.
//
// @private
// @param {module:core/editor/editor~Editor} editor
// @param {module:engine/model/selection~Selection} selection
// @returns {Boolean}
function isFileAllowedInParent( editor, selection ) {
	const fileType = determineFileTypeForInsertion( editor, selection );

	if ( fileType == 'fileBlock' ) {
		const parent = getInsertFileParent( selection, editor.model );

		if ( editor.model.schema.checkChild( parent, 'fileBlock' ) ) {
			return true;
		}
	} else if ( editor.model.schema.checkChild( selection.focus, 'fileInline' ) ) {
		return true;
	}

	return false;
}

// Checks if selection is not placed inside an file (e.g. its caption).
//
// @private
// @param {module:engine/model/selection~Selectable} selection
// @returns {Boolean}
function isNotInsideFile( selection ) {
	return [ ...selection.focus.getAncestors() ].every( ancestor => !ancestor.is( 'element', 'fileBlock' ) );
}

// Returns a node that will be used to insert file with `model.insertContent`.
//
// @private
// @param {module:engine/model/selection~Selection} selection
// @param {module:engine/model/model~Model} model
// @returns {module:engine/model/element~Element}
function getInsertFileParent( selection, model ) {
	const insertionRange = findOptimalInsertionRange( selection, model );
	const parent = insertionRange.start.parent;

	if ( parent.isEmpty && !parent.is( 'element', '$root' ) ) {
		return parent.parent;
	}

	return parent;
}

// Determine file element type name depending on editor config or place of insertion.
//
// @private
// @param {module:core/editor/editor~Editor} editor
// @param {module:engine/model/selection~Selectable} selectable
// @param {'fileBlock'|'fileInline'} [fileType] File element type name. Used to force return of provided element name,
// but only if there is proper plugin enabled.
// @returns {'fileBlock'|'fileInline'} fileType
function determineFileTypeForInsertion( editor, selectable, fileType ) {
	const schema = editor.model.schema;
	let configFileInsertType = editor.config.get( 'file.insert.type' );
	configFileInsertType = 'inline';

	
	if ( !editor.plugins.has( 'FileInlineEditing' ) ) {
		return 'fileBlock';
	}

	if ( !editor.plugins.has( 'FileBlockEditing' ) ) {
		return 'fileInline';
	}
	if ( fileType ) {
		return fileType;
	}

	if ( configFileInsertType === 'inline' ) {
		return 'fileInline';
	}

	if ( configFileInsertType === 'block' ) {
		return 'fileBlock';
	}

	// Try to replace the selected widget (e.g. another file).
	if ( selectable.is( 'selection' ) ) {
		return determineFileTypeForInsertionAtSelection( schema, selectable );
	}

	return schema.checkChild( selectable, 'fileInline' ) ? 'fileInline' : 'fileBlock';
}


function determinFileTypeForInsertion( editor, selectable, fileType ) {
	const schema = editor.model.schema;
	let configFileInsertType = editor.config.get( 'file.insert.type' );
	configFileInsertType = 'inline';

	

	if ( editor.plugins.has( 'FileInlineEditing' ) ) {
		return 'fileInline';
	}
	if ( fileType ) {
		return fileType;
	}

	if ( configFileInsertType === 'inline' ) {
		return 'fileInline';
	}

	// Try to replace the selected widget (e.g. another file).
	if ( selectable.is( 'selection' ) ) {
		return 'fileInline';
	}

	return 'fileInline';
}
