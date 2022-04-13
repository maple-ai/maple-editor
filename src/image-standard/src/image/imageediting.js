/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module image/image/imageediting
 */

import { Plugin } from 'ckeditor5/src/core';
import ImageStandardLoadObserver from './imageloadobserver';
import InsertImageStandardCommand from './insertimagecommand';
import ImageStandardUtils from '../imageutils';

/**
 * The image engine plugin. This module loads common code shared between
 * {@link module:image/image/imageinlineediting~ImageStandardInlineEditing} and
 * {@link module:image/image/imageblockediting~ImageStandardBlockEditing} plugins.
 *
 * This plugin registers the {@link module:image/image/insertimagecommand~InsertImageStandardCommand 'insertImageStandard'} command.
 *
 * @extends module:core/plugin~Plugin
 */
export default class ImageStandardEditing extends Plugin {
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
		return 'ImageStandardEditing';
	}

	/**
	 * @inheritDoc
	 */
	init() {
		const editor = this.editor;
		const conversion = editor.conversion;

		// See https://github.com/ckeditor/ckeditor5-image/issues/142.
		editor.editing.view.addObserver( ImageStandardLoadObserver );

		conversion.for( 'upcast' )
			.attributeToAttribute( {
				view: {
					name: 'img',
					key: 'data-type'
				},
				model: 'data-type'
			} )
			.attributeToAttribute( {
				view: {
					name: 'img',
					key: 'alt'
				},
				model: 'alt'
			} )
			.attributeToAttribute( {
				view: {
					name: 'img',
					key: 'srcset'
				},
				model: {
					key: 'srcset',
					value: viewImageStandard => {
						const value = {
							data: viewImageStandard.getAttribute( 'srcset' )
						};

						if ( viewImageStandard.hasAttribute( 'width' ) ) {
							value.width = viewImageStandard.getAttribute( 'width' );
						}

						return value;
					}
				}
			} );

		const insertImageStandardCommand = new InsertImageStandardCommand( editor );

		// Register `insertImageStandard` command and add `imageInsert` command as an alias for backward compatibility.
		editor.commands.add( 'insertImageStandard', insertImageStandardCommand );
		editor.commands.add( 'imageInsert', insertImageStandardCommand );
	}
}
