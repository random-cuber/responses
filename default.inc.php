<?php
		
// Plugin default configuration file.
// Override these entries in the global config file.
// Users can change exposed entries form the application settings ui.
$config = array();

// activate plugin features
$config['plugin.responses.activate_plugin'] = true;

// permit plugin logging
$config['plugin.responses.enable_logging'] = true;

// permit address book lookup
$config['plugin.responses.enable_addrbook'] = true; // TODO

// allow to inject plugin-provided templates
$config['plugin.responses.enable_inject'] = true;

// inject plugin-provided templates as read-only vs editable
$config['plugin.responses.inject_static'] = true;

// switch compose editor format to match the template
$config['plugin.responses.switch_format'] = true;

// suppress editor mode (html vs text) change warning
$config['plugin.responses.editor_warned'] = true;

// allow one time reset of all user responses 
$config['plugin.responses.memento_reset'] = false;

// surrounding field brackets, i.e. variable: {from_name}
$config['plugin.responses.variable_prefix'] = '{';
$config['plugin.responses.variable_suffix'] = '}';

// regex for 'html' template format detection: i.e. name looks like: "some name : html"
$config['plugin.responses.format_regex_name'] = '^html[\s:#@]+.+|.+[\s:#@]+html$';

// regex for 'html' template format detection: i.e. body looks like: "<div> ... </div>"
$config['plugin.responses.format_regex_text'] = '^[<][\s\S]+[>]$';

// regex for directive extracton from the template; note: keep key=value format
$config['plugin.responses.directive_pattern'] = '^\s*###directive###\s*([^=\s]+)\s*=\s*(.+)\s*$';

// XXX: no config override
// plugin-provided template
$response_help = <<<EOT
    #
    This response template shows available plugin fields.
    Variable substitution uses curly braces around field names. 
    To review this tempalte structure, see: 'Settings -> Responses -> ...'.
    #
    Availble field types (reflected as suffux in the field name):
    'text' - original field value [ example: "last, first" <user@host> ]
    'name' - contact name derived form address [ example: "last, first" ]
    'full' - full name guessed form address [ example: "First Last" ]
    'head' - first name guessed form address [ example: "First" ]
    'tail' - last name guessed form address [ example: "Last" ]
    'mail' - mail-only extracted form address [ example: "user@host" ]
    'subj' - original response subject 
    #
    Directive format: [maker] key=value
    Directive values also can use variable substituion.
    Directives are processing instructions which are applied and removed from the tempalte.
    Available directives:
    'subject_replace' - substitute response subect: 
    ###directive### subject_replace = [this subject comes from directive] {subj}/{to_mail}
    #
    Template variable substitution result (view in the mail compose window):
    #
    # message 'subject'
        subj : {subj} 
    # mail 'from' - solo item
        from_text : {from_text}
        from_name : {from_name}
        from_full : {from_full}
        from_head : {from_head}
        from_tail : {from_tail}
        from_mail : {from_mail}
    #
    # mail 'to' - one line item list, with comma separator
        to_text : {to_text}
        to_name : {to_name}
        to_full : {to_full}
        to_head : {to_head}
        to_tail : {to_tail}
        to_mail : {to_mail}
    #
    # mail 'cc' - one line item list, with comma separator
        cc_text : {cc_text}
        cc_name : {cc_name}
        cc_full : {cc_full}
        cc_head : {cc_head}
        cc_tail : {cc_tail}
        cc_mail : {cc_mail}
EOT;

// XXX: no config override
// plugin-provided template
$response_text_thank_you = <<<EOT
###directive### subject_replace = [YES] {subj} 
    {to_head}, hello.
    
    Thank you,
    {from_head}.
    
    --
    {from_full} <{from_mail}>
EOT;
 
// XXX: no config override
// plugin-provided template
$response_html_thank_you = <<<EOT
<div style="margin-left:2em;">
###directive### subject_replace = [YES] {subj} 
    <b>{to_head}</b>, hello.
    <br/>
    <br/>
    <br/>
    Thank you,
    <br/>
    <b>{from_head}</b>.
</div>
<p/>
<div style="width: 30em;">
    <hr>
    <i>
    {from_full}
    &lt;<a href="mailto:{from_mail}">{from_mail}</a>&gt;
    </i>
</div>
<p/>
EOT;

// XXX: name is response identity
// TODO: use local system templates
// plugin-provided template collection
$config['plugin.responses.template_mapa'] = array(
        array(
            'name' => '[plugin.responses] help',
            'text' => $response_help,
            'format' => 'text',
        ),
        array(
            'name' => '[plugin.responses] html thank you',
            'text' => $response_html_thank_you,
            'format' => 'html',
        ),
        array(
            'name' => '[plugin.responses] text thank you',
            'text' => $response_text_thank_you,
            'format' => 'text',
        ),
);

/////// settings

// expose these settings in user ui
$config['plugin.responses.settings_checkbox_list'] = array(
        'activate_plugin',
        'enable_logging',
        // 'enable_addrbook',
        'enable_inject',
        'inject_static',
        'switch_format',
        // 'editor_warned',
        // 'memento_reset',
);

// expose these settings in user ui
$config['plugin.responses.settings_select_list'] = array(
);

// expose these settings in user ui
$config['plugin.responses.settings_area_list'] = array(
);

// expose these settings in user ui
$config['plugin.responses.settings_text_list'] = array(
        // 'format_regex_name',
        // 'format_regex_text',
        // 'variable_prefix',
        // 'variable_suffix',
);

?>
