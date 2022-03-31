/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

// The editor creator to use.
import InlineEditorBase from '@ckeditor/ckeditor5-editor-inline/src/inlineeditor';

import Essentials from '@ckeditor/ckeditor5-essentials/src/essentials';
import UploadAdapter from '@ckeditor/ckeditor5-adapter-ckfinder/src/uploadadapter';
import Autoformat from '@ckeditor/ckeditor5-autoformat/src/autoformat';
import Bold from '@ckeditor/ckeditor5-basic-styles/src/bold';
import Italic from '@ckeditor/ckeditor5-basic-styles/src/italic';
import BlockQuote from '@ckeditor/ckeditor5-block-quote/src/blockquote';
import CKFinder from '@ckeditor/ckeditor5-ckfinder/src/ckfinder';
import EasyImage from '@ckeditor/ckeditor5-easy-image/src/easyimage';
import Heading from './heading/src/heading';
import Image from './image/src/image';
import ImageCaption from './image/src/imagecaption';
import ImageStyle from './image/src/imagestyle';
import ImageToolbar from './image/src/imagetoolbar';
import ImageUpload from './image/src/imageupload';
import ImageDelete from './image/src/imagedelete';
import ImageType from './image/src/imagetype';

import ImageStandard from './image-standard/src/image';
import ImageStandardToolbar from './image-standard/src/imagetoolbar';
import ImageStandardUpload from './image-standard/src/imageupload';
import ImageStandardDelete from './image-standard/src/imagestandarddelete';

import File from './file/src/file';
import FileToolbar from './file/src/filetoolbar';
import FileUpload from './file/src/fileupload';
import FileDelete from './file/src/filedelete';

// import FileUpload from './image/src/fileupload';
import Indent from '@ckeditor/ckeditor5-indent/src/indent';
import Link from '@ckeditor/ckeditor5-link/src/link';
import Invite from './invite/src/invite';
import List from '@ckeditor/ckeditor5-list/src/list';
import MediaEmbed from '@ckeditor/ckeditor5-media-embed/src/mediaembed';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import PasteFromOffice from '@ckeditor/ckeditor5-paste-from-office/src/pastefromoffice';
import Table from '@ckeditor/ckeditor5-table/src/table';
import TableToolbar from '@ckeditor/ckeditor5-table/src/tabletoolbar';
import TextTransformation from '@ckeditor/ckeditor5-typing/src/texttransformation';
import CloudServices from '@ckeditor/ckeditor5-cloud-services/src/cloudservices';

import HeadingButtonsUI from './heading/src/headingbuttonsui';
import ParagraphButtonUI from '@ckeditor/ckeditor5-paragraph/src/paragraphbuttonui';

import ImageResize from './image/src/imageresize';
import ImageResizeEditing from './image/src/imageresize/imageresizeediting';
import ImageResizeHandles from './image/src/imageresize/imageresizehandles';

import ImageTypes from './image/src/imagetypes';
import ImageTypesEditing from './image/src/imagetypes/imagetypesediting';

import Underline from '@ckeditor/ckeditor5-basic-styles/src/underline';
import Alignment from '@ckeditor/ckeditor5-alignment/src/alignment';
import SimpleUploadAdapter from '@ckeditor/ckeditor5-upload/src/adapters/simpleuploadadapter';
import wordcount from '@ckeditor/ckeditor5-word-count/src/wordcount';

import Mention from "@ckeditor/ckeditor5-mention/src/mention";

import TodoList from '@ckeditor/ckeditor5-list/src/todolist';

import Emoji from './emoji';

import EmojiPeople from "./emoji-people";
import EmojiNature from "./emoji-nature";
import EmojiFood from "./emoji-food";
import EmojiActivity from "./emoji-activity";
import EmojiObjects from "./emoji-objects";
import EmojiPlaces from "./emoji-places";
import EmojiSymbols from "./emoji-symbols";
import EmojiFlags from "./emoji-flags";

export default class InlineEditor extends InlineEditorBase {}

// Plugins to include in the build.
InlineEditor.builtinPlugins = [
	Essentials,
	UploadAdapter,
	Autoformat,
	Bold,
	Italic,
	BlockQuote,
	CKFinder,
	CloudServices,
	EasyImage,
	Heading,
	Image,
	ImageCaption,
	ImageStyle,
	ImageToolbar,

	ImageUpload,

	ImageStandard,
	ImageStandardToolbar,

	ImageStandardUpload,

	ImageStandardDelete,

	File,
	FileToolbar,

	FileUpload,
	FileDelete,

	Indent,
	Link,
	Invite,

	List,
	MediaEmbed,
	Paragraph,
	PasteFromOffice,
	Table,
	TableToolbar,
	TextTransformation,

	TodoList,

	HeadingButtonsUI,
	ParagraphButtonUI,
	
	ImageResize,
	ImageResizeEditing,
	ImageResizeHandles,
	ImageTypes,
	ImageTypesEditing,
	ImageDelete,
	ImageType,

	Mention,

	Underline,
	Alignment,
	Emoji,
	EmojiPeople,
	EmojiNature,
	EmojiPlaces,
	EmojiFood,
	EmojiActivity,
	EmojiObjects,
	EmojiSymbols,
	EmojiFlags,
	SimpleUploadAdapter,
	wordcount
];

// Editor configuration.
InlineEditor.defaultConfig = {
	toolbar: {
		items: [
			'heading',
			'|',
			'bold',
			'italic',
			'underline',
			'alignment',
			'|',
			'todoList',
			'bulletedList',
			'numberedList',
			'insertTable',
			'|',
			'blockQuote',
			'uploadImage',
			'uploadFile',
			'mediaEmbed',
			'emoji',
			'link',
			'invite',
			'|',
			'undo',
			'redo'
		]
	},
	file: {
		toolbar: [
			'fileDelete',
		],
	},

	imageStandard: {
		toolbar: [
			'imageStandardDelete',
		],
	},

	image: {
		resizeOptions: [
			{
				name: 'resizeImage:original',
				value: null,
				label: 'Original'
			},
			{
				name: 'resizeImage:40',
				value: '40',
				label: '40%'
			},
			{
				name: 'resizeImage:60',
				value: '60',
				label: '60%'
			},
			{
				name: 'resizeImage:100',
				value: '100',
				label: '100%'
			}
		],
		imageTypeOptions: [
			{
				name: 'imageTypes:default',
				value: null,
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
		],
		toolbar: [
			'imageStyle:inline',
			'imageStyle:wrapText',
			'resizeImage',
			'|',
			'imageTextAlternative',
			'imageDelete',
			'imageTypes'
		],
	},

	table: {
		contentToolbar: [
			'tableColumn',
			'tableRow',
			'mergeTableCells'
		]
	},
	simpleUpload: {
		uploadUrl: 'http://localhost:2000/api/v1/upload',
		withCredentials: true,
		headers: {
			'API-KEY': 'API-KEY',
		}
	},
	language: 'en'
};
