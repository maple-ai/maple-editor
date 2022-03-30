/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module image/imageresize
 */

import { Plugin } from 'ckeditor5/src/core';
import ImageStandardResizeButtons from './imageresize/imageresizebuttons';
import ImageStandardResizeEditing from './imageresize/imageresizeediting';
import ImageStandardResizeHandles from './imageresize/imageresizehandles';

import '../theme/imageresize.css';

/**
 * The image resize plugin.
 *
 * It adds a possibility to resize each image using handles.
 *
 * @extends module:core/plugin~Plugin
 */
export default class ImageStandardResize extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ ImageStandardResizeEditing, ImageStandardResizeHandles, ImageStandardResizeButtons ];
	}

	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'ImageStandardResize';
	}
}

/**
 * The available options are `'px'` or `'%'`.
 *
 * Determines the size unit applied to the resized image.
 *
 *		ClassicEditor
 *			.create( editorElement, {
 *				image: {
 *					resizeUnit: 'px'
 *				}
 *			} )
 *			.then( ... )
 *			.catch( ... );
 *
 *
 * This option is used by the {@link module:image/imageresize~ImageStandardResize} feature.
 *
 * @default '%'
 * @member {String} module:image/image~ImageStandardConfig#resizeUnit
 */

/**
 * The image resize options.
 *
 * Each option should have at least these two properties:
 *
 * * name: The name of the UI component registered in the global
 * {@link module:core/editor/editorui~EditorUI#componentFactory component factory} of the editor,
 * representing the button a user can click to change the size of an image,
 * * value: An actual image width applied when a user clicks the mentioned button
 * ({@link module:image/imageresize/resizeimagecommand~ResizeImageStandardCommand} gets executed).
 * The value property is combined with the {@link module:image/image~ImageStandardConfig#resizeUnit `config.image.resizeUnit`} (`%` by default).
 * For instance: `value: '50'` and `resizeUnit: '%'` will render as `'50%'` in the UI.
 *
 * **Resetting the image size**
 *
 * If you want to set an option that will reset image to its original size, you need to pass a `null` value
 * to one of the options. The `:original` token is not mandatory, you can call it anything you wish, but it must reflect
 * in the standalone buttons configuration for the image toolbar.
 *
 *		ClassicEditor
 *			.create( editorElement, {
 *				image: {
 *					resizeUnit: "%",
 *					resizeOptions: [ {
 *						name: 'resizeImageStandard:original',
 *						value: null
 *					},
 *					{
 *						name: 'resizeImageStandard:50',
 *						value: '50'
 *					},
 *					{
 *						name: 'resizeImageStandard:75',
 *						value: '75'
 *					} ]
 *				}
 *			} )
 *			.then( ... )
 *			.catch( ... );
 *
 * **Resizing images using a dropdown**
 *
 * With resize options defined, you can decide whether you want to display them as a dropdown or as standalone buttons.
 * For the dropdown, you need to pass only the `resizeImageStandard` token to the
{@link module:image/image~ImageStandardConfig#toolbar `config.image.toolbar`}. The dropdown contains all defined options by default:
 *
 *		ClassicEditor
 *			.create( editorElement, {
 *				image: {
 *					resizeUnit: "%",
 *					resizeOptions: [ {
 *						name: 'resizeImageStandard:original',
 *						value: null
 *					},
 *					{
 *						name: 'resizeImageStandard:50',
 *						value: '50'
 *					},
 *					{
 *						name: 'resizeImageStandard:75',
 *						value: '75'
 *					} ],
 *					toolbar: [ 'resizeImageStandard', ... ],
 *				}
 *			} )
 *			.then( ... )
 *			.catch( ... );
 *
 * **Resizing images using individual buttons**
 *
 * If you want to have separate buttons for {@link module:image/imageresize/imageresizebuttons~ImageStandardResizeOption each option},
 * pass their names to the {@link module:image/image~ImageStandardConfig#toolbar `config.image.toolbar`} instead. Please keep in mind
 * that this time **you must define the additional
 * {@link module:image/imageresize/imageresizebuttons~ImageStandardResizeOption `icon` property}**:
 *
 *		ClassicEditor
 *			.create( editorElement, {
 *				image: {
 *					resizeUnit: "%",
 *					resizeOptions: [ {
 *						name: 'resizeImageStandard:original',
 *						value: null,
 *						icon: 'original'
 *					},
 *					{
 *						name: 'resizeImageStandard:25',
 *						value: '25',
 *						icon: 'small'
 *					},
 *					{
 *						name: 'resizeImageStandard:50',
 *						value: '50',
 *						icon: 'medium'
 *					},
 *					{
 *						name: 'resizeImageStandard:75',
 *						value: '75',
 *						icon: 'large'
 *					} ],
 *					toolbar: [ 'resizeImageStandard:25', 'resizeImageStandard:50', 'resizeImageStandard:75', 'resizeImageStandard:original', ... ],
 *				}
 *			} )
 *			.then( ... )
 *			.catch( ... );
 *
 * **Customizing resize button labels**
 *
 * You can set your own label for each resize button. To do that, add the `label` property like in the example below.
 *
 * * When using the **dropdown**, the labels are displayed on the list of all options when you open the dropdown.
 * * When using **standalone buttons**, the labels will are displayed as tooltips when a user hovers over the button.
 *
 *		ClassicEditor
 *			.create( editorElement, {
 *				image: {
 *					resizeUnit: "%",
 *					resizeOptions: [ {
 *						name: 'resizeImageStandard:original',
 *						value: null,
 *						label: 'Original size'
 *						// Note: add the "icon" property if you're configuring a standalone button.
 *					},
 *					{
 *						name: 'resizeImageStandard:50',
 *						value: '50',
 *						label: 'Medium size'
 *						// Note: add the "icon" property if you're configuring a standalone button.
 *					},
 *					{
 *						name: 'resizeImageStandard:75',
 *						value: '75',
 *						label: 'Large size'
 *						// Note: add the "icon" property if you're configuring a standalone button.
 *					} ]
 *				}
 *			} )
 *			.then( ... )
 *			.catch( ... );
 *
 * **Default value**
 *
 * The following configuration is used by default:
 *
 *		resizeOptions = [
 *			{
 *				name: 'resizeImageStandard:original',
 *				value: null,
 *				icon: 'original'
 *			},
 *			{
 *				name: 'resizeImageStandard:25',
 *				value: '25',
 *				icon: 'small'
 *			},
 *			{
 *				name: 'resizeImageStandard:50',
 *				value: '50',
 *				icon: 'medium'
 *			},
 *			{
 *				name: 'resizeImageStandard:75',
 *				value: '75',
 *				icon: 'large'
 *			}
 *		];
 *
 * @member {Array.<module:image/imageresize/imageresizebuttons~ImageStandardResizeOption>} module:image/image~ImageStandardConfig#resizeOptions
 */
