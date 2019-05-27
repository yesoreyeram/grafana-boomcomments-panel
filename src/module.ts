///<reference path="../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />

import _ from "lodash";
import { PanelCtrl, loadPluginCss } from "app/plugins/sdk";

let PLUGIN_ID = "yesoreyeram-boomcomments-panel";

const CONFIG = {
  comment_postbox_positions: [
    { text: "Top", value: "top" },
    { text: "Bottom", value: "bottom" },
  ],
  comment_tag: "boom-comment",
  comments_order: [
    { text: "New Comments at Top", value: "new_comments_at_top" },
    { text: "New Comments at Bottom", value: "new_comments_at_bottom" },
  ],
  cssThemes: {
    dark: `plugins/${PLUGIN_ID}/css/default.dark.css`,
    light: `plugins/${PLUGIN_ID}/css/default.light.css`
  },
  default_templateURL: "partials/module.html",
  editorTabs: [
    {
      position: 2,
      templatePath: `public/plugins/${PLUGIN_ID}/partials/options.html`,
      title: "Panel Options"
    }
  ],
  grafana_events: {
    dataReceived: "data-received",
    initEditMode: "init-edit-mode",
    panelTeardown: "panel-teardown",
    refresh: "refresh",
    render: "render"
  }
};


loadPluginCss(CONFIG.cssThemes);

class BoomCommentsCtl extends PanelCtrl {

  public static templateUrl = CONFIG.default_templateURL;
  public scope: any;
  public ctrl: any;
  public elem: any;
  public attrs: any;
  public $http: any;
  public backendSrv: any;
  public nextTickPromise: any;
  public raw_comments: any[] = [];
  public comments: any[] = [];
  public activeEditorTabIndex = -2;
  public comment_postbox_positions = CONFIG.comment_postbox_positions;
  public comments_order = CONFIG.comments_order;

  public panelDefaults = {

    comment_postbox_position: "bottom",
    comment_tag: CONFIG.comment_tag,
    comments_order: "new_comments_at_top",
    enable_inline_commentbox: false,
    highlight_newComments: true,
    highlight_newComments_color: "yellow",
    highlight_newComments_minutes: 3,
    number_of_comments_to_show: 5,
    refresh_frequency: 10

  };

  constructor($scope, $injector, $http, backendSrv) {

    super($scope, $injector);
    _.defaultsDeep(this.panel, this.panelDefaults);

    this.$http = $http;
    this.backendSrv = backendSrv;

    this.events.on(CONFIG.grafana_events.initEditMode, this.onInitEditMode.bind(this));
    this.events.on(CONFIG.grafana_events.panelTeardown, this.onPanelTeardown.bind(this));
    this.events.on(CONFIG.grafana_events.refresh, this.refreshComments.bind(this));
    this.events.on(CONFIG.grafana_events.render, this.refreshComments.bind(this));

    this.refreshComments();

  }

  private onPanelTeardown() {

    this.$timeout.cancel(this.nextTickPromise);

  }

  private onInitEditMode(): void {

    _.each(CONFIG.editorTabs, editorTab => {
      this.addEditorTab(editorTab.title, editorTab.templatePath, editorTab.position);
    });

  }

  public addComment(): void {

    if (this.ctrl.comment_text && this.ctrl.comment_text !== "") {

      let commentOptions = {
        "tags": [this.ctrl.panel.comment_tag],
        "text": `${this.ctrl.comment_text}`
      };

      if (this.ctrl.comment_tags && this.ctrl.comment_tags !== "") {
        _.each(this.ctrl.comment_tags.split(";").map(t => t.trim()), tag => {
          commentOptions.tags.push(tag);
        });
      }

      if (this.ctrl.comment_bgColor && this.ctrl.comment_bgColor !== "") {
        commentOptions.tags.push(`boom-bgcolor=${this.ctrl.comment_bgColor}`);
      }

      if (this.ctrl.comment_textColor && this.ctrl.comment_textColor !== "") {
        commentOptions.tags.push(`boom-color=${this.ctrl.comment_textColor}`);
      }

      if (this.ctrl.comment_fontSize && this.ctrl.comment_fontSize !== "") {
        commentOptions.tags.push(`boom-fontsize=${this.ctrl.comment_fontSize || "100"}`);
      }

      this.backendSrv.post('/api/annotations', commentOptions).then(response => {
        console.log("Comment added", response);
        this.ctrl.comment_text = "";
        this.ctrl.comment_tags = "";
        this.ctrl.comment_bgColor = "";
        this.ctrl.comment_textColor = "";
        this.ctrl.comment_fontSize = "";
        this.refreshComments();
      });

    }

  }

  public refreshComments(): void {

    this.$timeout.cancel(this.nextTickPromise);

    this.backendSrv.get(`/api/annotations?tags=boom-comment&limit=${this.panel.number_of_comments_to_show || 10}`).then(annotations => {
      this.raw_comments = annotations;
      this.render();
    });

    this.nextTickPromise = this.$timeout(this.refreshComments.bind(this), this.panel.refresh_frequency * 1000);
  }

  public link(scope: any, elem: any, attrs: any, ctrl: any): void {

    this.scope = scope;
    this.elem = elem;
    this.attrs = attrs;

    this.ctrl = ctrl;
  }

}

let getTooltipMessage = function (annotation: any): string {

  return `
${annotation.text}

Message by : ${annotation.login} (${annotation.email})
Created at : ${ new Date(annotation.created)}
Updated at : ${ new Date(annotation.updated)}
Tags : ${ annotation.tags.join(", ")}
  `;

};

let sortAndSliceComments = function (raw_comments: any[], sort_order: string, elementsToReturn: number): any[] {

  let sorted_comments = _.sortBy(raw_comments, [function (o) { return o.time; }]);

  if (sort_order === "new_comments_at_top") {
    sorted_comments = _.sortBy(sorted_comments, [function (o) { return -1 * o.time; }]);
  } else if (sort_order === "new_comments_at_bottom") {
    sorted_comments = _.sortBy(sorted_comments, [function (o) { return o.time; }]);
  }

  return _.take(sorted_comments, elementsToReturn);

};

let getPanelStyle = function (highlight_newComments_color): string {

  return `
    @keyframes blinkbg {
        50% {
            background-color: ${highlight_newComments_color || "white"};
            color: black;
        }
    }
  `;

};

BoomCommentsCtl.prototype.render = function () {


  let panelStyle = getPanelStyle(this.ctrl.panel.highlight_newComments_color);
  const style = document.createElement('style');
  style.type = 'text/css';
  style.appendChild(document.createTextNode(panelStyle));
  this.elem.find("#boom-comments-style").html("");
  this.elem.find("#boom-comments-style").append(style);

  this.comments = [];
  this.raw_comments = sortAndSliceComments(this.raw_comments, this.panel.comments_order, +(this.ctrl.panel.number_of_comments_to_show));

  _.each(this.raw_comments, (annotation) => {

    let comment = annotation;
    comment.displayText = `${annotation.text}`;
    comment.displayTitle = getTooltipMessage(annotation);

    comment.date = new Date(annotation.created);

    let display_comment_classes: any[] = [];
    if (this.ctrl.panel.highlight_newComments === true && comment.created > ((new Date()).getTime() - (this.ctrl.panel.highlight_newComments_minutes * 60 * 1000))) {
      display_comment_classes.push("blink-comment");
    }
    comment.displayClass = display_comment_classes.join(" ");

    comment.inlinestyle = {};
    _.each(comment.tags, tag => {
      if (tag.trim().toLowerCase().startsWith("boom-bgcolor=") === true) {
        comment.inlinestyle.background = tag.trim().toLowerCase().replace("boom-bgcolor=", "");
      } else if (tag.trim().toLowerCase().startsWith("boom-color=") === true) {
        comment.inlinestyle.color = tag.trim().toLowerCase().replace("boom-color=", "");
      } else if (tag.trim().toLowerCase().startsWith("boom-fontsize=") === true) {
        comment.inlinestyle["font-size"] = tag.trim().toLowerCase().replace("boom-fontsize=", "") + "%";
      }
    });

    this.comments.push(comment);
  });

};

export { BoomCommentsCtl as PanelCtrl };
