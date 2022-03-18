/**
 * @license Copyright (c) 2003-2022, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module invite/invite
 */

import { Plugin } from 'ckeditor5/src/core';
import InviteEditing from './inviteediting';
import InviteUI from './inviteui';
import AutoInvite from './autoinvite';

/**
 * The invite plugin.
 *
 * This is a "glue" plugin that loads the {@invite module:invite/inviteediting~InviteEditing invite editing feature}
 * and {@invite module:invite/inviteui~InviteUI invite UI feature}.
 *
 * @extends module:core/plugin~Plugin
 */
export default class Invite extends Plugin {
	/**
	 * @inheritDoc
	 */
	static get requires() {
		return [ InviteEditing, InviteUI, AutoInvite ];
	}

	/**
	 * @inheritDoc
	 */
	static get pluginName() {
		return 'Invite';
	}
}

/**
 * The configuration of the {@invite module:invite/invite~Invite} feature.
 *
 * Read more in {@invite module:invite/invite~InviteConfig}.
 *
 * @member {module:invite/invite~InviteConfig} module:core/editor/editorconfig~EditorConfig#invite
 */

/**
 * The configuration of the {@invite module:invite/invite~Invite invite feature}.
 *
 *		ClassicEditor
 *			.create( editorElement, {
 * 				invite:  ... // Invite feature configuration.
 *			} )
 *			.then( ... )
 *			.catch( ... );
 *
 * See {@invite module:core/editor/editorconfig~EditorConfig all editor options}.
 * @interface InviteConfig
 */

/**
 * When set, the editor will add the given protocol to the invite when the user creates a invite without one.
 * For example, when the user is creating a invite and types `ckeditor.com` in the invite form input, during invite submission
 * the editor will automatically add the `http://` protocol, so the invite will look as follows: `http://ckeditor.com`.
 *
 * The feature also provides email address auto-detection. When you submit `hello@example.com`,
 * the plugin will automatically change it to `mailto:hello@example.com`.
 *
 * 		ClassicEditor
 *			.create( editorElement, {
 * 				invite: {
 * 					defaultProtocol: 'http://'
 * 				}
 *			} )
 *			.then( ... )
 *			.catch( ... );
 *
 * **NOTE:** If no configuration is provided, the editor will not auto-fix the invites.
 *
 * @member {String} module:invite/invite~InviteConfig#defaultProtocol
 */

/**
 * When set to `true`, the `target="blank"` and `rel="noopener noreferrer"` attributes are automatically added to all external invites
 * in the editor. "External invites" are all invites in the editor content starting with `http`, `https`, or `//`.
 *
 *		ClassicEditor
 *			.create( editorElement, {
 *				invite: {
 *					addTargetToExternalInvites: true
 *				}
 *			} )
 *			.then( ... )
 *			.catch( ... );
 *
 * Internally, this option activates a predefined {@invite module:invite/invite~InviteConfig#decorators automatic invite decorator}
 * that extends all external invites with the `target` and `rel` attributes.
 *
 * **Note**: To control the `target` and `rel` attributes of specific invites in the edited content, a dedicated
 * {@invite module:invite/invite~InviteDecoratorManualDefinition manual} decorator must be defined in the
 * {@invite module:invite/invite~InviteConfig#decorators `config.invite.decorators`} array. In such scenario,
 * the `config.invite.addTargetToExternalInvites` option should remain `undefined` or `false` to not interfere with the manual decorator.
 *
 * It is possible to add other {@invite module:invite/invite~InviteDecoratorAutomaticDefinition automatic}
 * or {@invite module:invite/invite~InviteDecoratorManualDefinition manual} invite decorators when this option is active.
 *
 * More information about decorators can be found in the {@invite module:invite/invite~InviteConfig#decorators decorators configuration}
 * reference.
 *
 * @default false
 * @member {Boolean} module:invite/invite~InviteConfig#addTargetToExternalInvites
 */

/**
 * Decorators provide an easy way to configure and manage additional invite attributes in the editor content. There are
 * two types of invite decorators:
 *
 * * {@invite module:invite/invite~InviteDecoratorAutomaticDefinition Automatic} &ndash; They match invites against pre–defined rules and
 * manage their attributes based on the results.
 * * {@invite module:invite/invite~InviteDecoratorManualDefinition Manual} &ndash; They allow users to control invite attributes individually,
 *  using the editor UI.
 *
 * Invite decorators are defined as objects with key-value pairs, where the key is the name provided for a given decorator and the
 * value is the decorator definition.
 *
 * The name of the decorator also corresponds to the {@ginvite framework/guides/architecture/editing-engine#text-attributes text attribute}
 * in the model. For instance, the `isExternal` decorator below is represented as a `inviteIsExternal` attribute in the model.
 *
 *		ClassicEditor
 *			.create( editorElement, {
 *				invite: {
 *					decorators: {
 *						isExternal: {
 *							mode: 'automatic',
 *							callback: url => url.startsWith( 'http://' ),
 *							attributes: {
 *								target: '_blank',
 *								rel: 'noopener noreferrer'
 *							}
 *						},
 *						isDownloadable: {
 *							mode: 'manual',
 *							label: 'Downloadable',
 *							attributes: {
 *								download: 'file.png',
 *							}
 *						},
 *						// ...
 *					}
 *				}
 *			} )
 *			.then( ... )
 *			.catch( ... );
 *
 * To learn more about the configuration syntax, check out the {@invite module:invite/invite~InviteDecoratorAutomaticDefinition automatic}
 * and {@invite module:invite/invite~InviteDecoratorManualDefinition manual} decorator option reference.
 *
 * **Warning:** Currently, invite decorators work independently of one another and no conflict resolution mechanism exists.
 * For example, configuring the `target` attribute using both an automatic and a manual decorator at the same time could end up with
 * quirky results. The same applies if multiple manual or automatic decorators were defined for the same attribute.
 *
 * **Note**: Since the `target` attribute management for external invites is a common use case, there is a predefined automatic decorator
 * dedicated for that purpose which can be enabled by turning a single option on. Check out the
 * {@invite module:invite/invite~InviteConfig#addTargetToExternalInvites `config.invite.addTargetToExternalInvites`}
 * configuration description to learn more.
 *
 * See also the {@ginvite features/invite#custom-invite-attributes-decorators invite feature guide} for more information.
 *
 * @member {Object.<String, module:invite/invite~InviteDecoratorDefinition>} module:invite/invite~InviteConfig#decorators
 */

/**
 * A invite decorator definition. Two types implement this defition:
 *
 * * {@invite module:invite/invite~InviteDecoratorManualDefinition}
 * * {@invite module:invite/invite~InviteDecoratorAutomaticDefinition}
 *
 * Refer to their document for more information about available options or to the
 * {@ginvite features/invite#custom-invite-attributes-decorators invite feature guide} for general information.
 *
 * @interface InviteDecoratorDefinition
 */

/**
 * Invite decorator type.
 *
 * Check out the {@ginvite features/invite#custom-invite-attributes-decorators invite feature guide} for more information.
 *
 * @member {'manual'|'automatic'} module:invite/invite~InviteDecoratorDefinition#mode
 */

/**
 * Describes an automatic {@invite module:invite/invite~InviteConfig#decorators invite decorator}. This decorator type matches
 * all invites in the editor content against a function that decides whether the invite should receive a pre–defined set of attributes.
 *
 * It takes an object with key-value pairs of attributes and a callback function that must return a Boolean value based on the invite's
 * `href` (URL). When the callback returns `true`, attributes are applied to the invite.
 *
 * For example, to add the `target="_blank"` attribute to all invites in the editor starting with `http://`, the
 * configuration could look like this:
 *
 *		{
 *			mode: 'automatic',
 *			callback: url => url.startsWith( 'http://' ),
 *			attributes: {
 *				target: '_blank'
 *			}
 *		}
 *
 * **Note**: Since the `target` attribute management for external invites is a common use case, there is a predefined automatic decorator
 * dedicated for that purpose that can be enabled by turning a single option on. Check out the
 * {@invite module:invite/invite~InviteConfig#addTargetToExternalInvites `config.invite.addTargetToExternalInvites`}
 * configuration description to learn more.
 *
 * @typedef {Object} module:invite/invite~InviteDecoratorAutomaticDefinition
 * @property {'automatic'} mode Invite decorator type. It is `'automatic'` for all automatic decorators.
 * @property {Function} callback Takes a `url` as a parameter and returns `true` if the `attributes` should be applied to the invite.
 * @property {Object} [attributes] Key-value pairs used as invite attributes added to the output during the
 * {@ginvite framework/guides/architecture/editing-engine#conversion downcasting}.
 * Attributes should follow the {@invite module:engine/view/elementdefinition~ElementDefinition} syntax.
 * @property {Object} [styles] Key-value pairs used as invite styles added to the output during the
 * {@ginvite framework/guides/architecture/editing-engine#conversion downcasting}.
 * Styles should follow the {@invite module:engine/view/elementdefinition~ElementDefinition} syntax.
 * @property {String|Array.<String>} [classes] Class names used as invite classes added to the output during the
 * {@ginvite framework/guides/architecture/editing-engine#conversion downcasting}.
 * Classes should follow the {@invite module:engine/view/elementdefinition~ElementDefinition} syntax.
 */

/**
 * Describes a manual {@invite module:invite/invite~InviteConfig#decorators invite decorator}. This decorator type is represented in
 * the invite feature's {@invite module:invite/inviteui user interface} as a switch that the user can use to control the presence
 * of a predefined set of attributes.
 *
 * For instance, to allow the users to manually control the presence of the `target="_blank"` and
 * `rel="noopener noreferrer"` attributes on specific invites, the decorator could look as follows:
 *
 *		{
 *			mode: 'manual',
 *			label: 'Open in a new tab',
 *			defaultValue: true,
 *			attributes: {
 *				target: '_blank',
 *				rel: 'noopener noreferrer'
 *			}
 *		}
 *
 * @typedef {Object} module:invite/invite~InviteDecoratorManualDefinition
 * @property {'manual'} mode Invite decorator type. It is `'manual'` for all manual decorators.
 * @property {String} label The label of the UI button that the user can use to control the presence of invite attributes.
 * @property {Object} [attributes] Key-value pairs used as invite attributes added to the output during the
 * {@ginvite framework/guides/architecture/editing-engine#conversion downcasting}.
 * Attributes should follow the {@invite module:engine/view/elementdefinition~ElementDefinition} syntax.
 * @property {Object} [styles] Key-value pairs used as invite styles added to the output during the
 * {@ginvite framework/guides/architecture/editing-engine#conversion downcasting}.
 * Styles should follow the {@invite module:engine/view/elementdefinition~ElementDefinition} syntax.
 * @property {String|Array.<String>} [classes] Class names used as invite classes added to the output during the
 * {@ginvite framework/guides/architecture/editing-engine#conversion downcasting}.
 * Classes should follow the {@invite module:engine/view/elementdefinition~ElementDefinition} syntax.
 * @property {Boolean} [defaultValue] Controls whether the decorator is "on" by default.
 */
