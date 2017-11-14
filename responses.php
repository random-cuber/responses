<?php

//
// Roundcube Responses Plugin
//

class responses extends rcube_plugin {

    // client environment variables, push/pull
    private static $allowed_names = array(
    );
    
    // client environment variables, push only
    private static $environ_names = array(
        'activate_plugin',
        'enable_logging',
        'switch_format',
        'variable_prefix',
        'variable_suffix',
        'format_regex_name',
        'format_regex_text',
        'editor_warned',
        'directive_pattern',
    );
    
    // controller singleton
    private $rc; 

    // supported tasks regex filter
	public $task = 'mail|settings'; 
	
	function init() {
        $this->rc = rcmail::get_instance();
        $task = $this->rc->task; $action = $this->rc->action;

        // activate plugin for mail/compose
        if ($task == 'mail' && $this->is_root_request()) {
            if($action == 'compose' && $this->is_html_request()) {
                $this->init_config();
                $this->template_inject();
                $this->init_mail_html_page();
                return;
            }
            return;
        }

        // activate plugin for settings
        if ($task == 'settings') {
            $this->init_config();
            $this->template_reset();
            $this->template_inject();
            $this->add_hook('preferences_list', array($this, 'hook_preferences_list'));
            $this->add_hook('preferences_save', array($this, 'hook_preferences_save'));
            $this->add_texts('localization', true);
            return;
        }
                    	
	}
	
	//
	function is_plugin_active() {
	    return $this->config_get('activate_plugin');
	}
	
    // root vs frame window request
    function is_root_request() {
        return empty($_REQUEST['_framed']);
    }
	
    // html vs ajax request
    function is_html_request() {
        return $this->rc->output->type == 'html';
    }

    // plugin name space
    function key($name) {
        return 'plugin.responses.' . $name; // keep in sync with *.js
    }
    
    // plugin server logger
    function log($line, $force = false) {
        if($this->config_get('enable_logging') || $force){
            $file = $this->key('log');
            $func = debug_backtrace()[1]['function'];
            $text = $func . ' : ' . $line;
            rcube::write_log($file, $text);
        }
    }

    // setup config with default override
    function init_config() {
        $this->add_hook('config_get', array($this, 'hook_config_get'));
        $this->provide_default();
    }
    
    // load plugin default configuration file
    function provide_default($name = 'default.inc.php') {
        $config = null;
        $path = $this->home . '/' . $name;
        if ($path && is_file($path) && is_readable($path)) {
            ob_start();
            include($path);
            ob_end_clean();
        }
        if (is_array($config)) {
            $this->config_default = $config;
        }
    }
    
    // inject plugin default configuration
    function hook_config_get($args){
        $name = $args['name'];
        $result = $args['result'];
        $default = $this->config_default[$name];
        if(! isset($result) && isset($default)) {
            $args['result'] = $default;
        }
        return $args;
    }
    
    // 
    function init_mail_html_page() {
        $this->add_texts('localization', true);
        $this->include_script('responses.js');
        $this->provide_client_env_var();
    }

    // client environment variables
    function set_env($name, $value = null) {
        $key = $this->key($name);
        if(! isset($value)) {
            $value = $this->config_get($name);
        }
        $this->rc->output->set_env($key, $value);
    }
    
    // load plugin preferences
    function config_get($name) {
        $key = $this->key($name); 
        return $this->rc->config->get($key);
    }
    
    // save plugin preferences
    function config_put($name, $value) {
        $key = $this->key($name);
        $this->rc->user->save_prefs(array($key => $value));
    }

    // client environment variables
    function provide_client_env_var() {
        $name_list = array_merge(
            self::$allowed_names, self::$environ_names
        );
        foreach($name_list as $name) {
           $this->set_env($name);
        }
    }

    // remove all templates 
    function template_reset() {
        if(! $this->is_plugin_active()){
            return;
        }
        
        $memento_reset = $this->config_get('memento_reset');
        if($memento_reset) {
            $this->log('...');
            $this->config_put('memento_reset', false);
            $mapa_name = 'compose_responses'; 
            $response_mapa = array(); // erase
            $this->rc->user->save_prefs(array($mapa_name => array_values($response_mapa)));
        }
    }
    
    // ensure plugin templates
    // see rcmail.php rcmail.get_compose_responses()
    function template_inject() {
        if(! $this->is_plugin_active()){
            return;
        }
        
        $enable_inject = $this->config_get('enable_inject');
        $this->log('enable: ' . ($enable_inject ? 'true' : 'false'));
        if(! $enable_inject){
            return;
        }
        $config = $this->rc->config;
        $inject_static = $this->config_get('inject_static');
        $mapa_type = $inject_static ? 'core-pref' : 'user-pref';
        $mapa_name = $inject_static ? 'compose_responses_static' : 'compose_responses'; 
        $response_mapa = $config->get($mapa_name); // rcmail provided
        $template_mapa = $this->config_get('template_mapa'); // plugin provided
        foreach($template_mapa as $template) {
            $found = false;
            // XXX: name is response identity
            $name = $mapa_type . '/' . $template['name'];
            $key = substr(md5($name), 0, 16); // see see rcmail.php
            $template['key'] = $key; 
            foreach($response_mapa as $response) {
                if($template['key'] === $response['key']) {
                    $found = true;
                    break;
                }
            }
            $entry = $name. ' (key=' . $key . ')';
            if($found) {
                $this->log('exists: ' . $entry);
            } else {
                $this->log('inject: ' . $entry);
                $response_mapa[] = $template;
                if($inject_static){
                    // override rcmail
                    $config->set($mapa_name, $response_mapa); 
                } else {
                    // persist per user
                    $this->rc->user->save_prefs(array($mapa_name => array_values($response_mapa)));
                }
            }
        }
    }

    // localized quoted text
    function quoted($name) {
        return rcube::Q($this->gettext($name));
    }
    
    // read client post result
    function input_value($name) {
        $name = str_replace('.', '_', $name); // PHP convention
        return rcube_utils::get_input_value($name, rcube_utils::INPUT_POST);
    }
    
    ////////////////////////////
    
    // plugin settings section
    function is_plugin_section($args) {
        return $args['section'] == 'compose';
    }
    
    // settings exposed to user
    function settings_checkbox_list() {
        return $this->config_get('settings_checkbox_list');
    }

    // settings exposed to user
    function settings_select_list() {
        return $this->config_get('settings_select_list');
    }

    // settings exposed to user
    function settings_area_list() {
        return $this->config_get('settings_area_list');
    }

    // settings exposed to user
    function settings_text_list() {
        return $this->config_get('settings_text_list');
    }

    // settings checkbox
    function build_checkbox(& $entry, $name) {
        $key = $this->key($name);
        $checkbox = new html_checkbox(array(
             'id' => $key, 'name' => $key, 'value' => 1,
        ));
        $entry['options'][$name] = array(
            'title' => html::label($key, $this->quoted($name)),
            'content' => $checkbox->show($this->config_get($name)),
        );
    }

    // settings multi select
    function build_select(& $entry, $name, $option_list) {
        $key = $this->key($name);
        $select = new html_select(array(
             'id' => $key, 'name' => $key . '[]', // use array 
             'multiple' => true, 'size' => 5,
        ));
        $select->add($option_list, $option_list); // value => content
        $entry['options'][$name] = array(
            'title' => html::label($key, $this->quoted($name)),
            'content' => $select->show($this->config_get($name)),
        );
    }
    
    // settings multi line text area
    function build_textarea(& $entry, $name) {
        $key = $this->key($name);
        $textarea = new html_textarea(array(
             'id' => $key, 'name' => $key, 'rows' => 5, 'cols' => 45,
        ));
        $entry['options'][$name] = array(
            'title' => html::label($key, $this->quoted($name)),
            'content' => $textarea->show(implode(PHP_EOL, $this->config_get($name))),
        );
    }
    
    // settings single line text input
    function build_text(& $entry, $name) {
        $key = $this->key($name);
        $input = new html_inputfield(array(
             'id' => $key, 'name' => $key, 'value' => 1,
        ));
        $entry['options'][$name] = array(
            'title' => html::label($key, $this->quoted($name)),
            'content' => $input->show($this->config_get($name)),
        );
    }
    
    // build settings ui
    function hook_preferences_list($args) {
        if ($this->is_plugin_section($args)) {
            $blocks = & $args['blocks'];
            $section = $this->key('section'); // css
            $blocks[$section] = array(); $entry = & $blocks[$section];
            $entry['name'] = $this->quoted('plugin_responses');
            foreach($this->settings_checkbox_list() as $name) {
                $this->build_checkbox($entry, $name);
            }
            foreach($this->settings_select_list() as $name) {
                $this->build_select($entry, $name, self::$filter_type_list);
            }
            foreach($this->settings_area_list() as $name) {
                $this->build_textarea($entry, $name);
            }
            foreach($this->settings_text_list() as $name) {
                $this->build_text($entry, $name);
            }
        }
        return $args;
    }
    
    // settings checkbox
    function persist_checkbox(& $prefs, $name) {
        $key = $this->key($name); $value = $this->input_value($key);
        $prefs[$key] =  $value ? true : false;
    }
  
    // settings multi select
    function persist_select(& $prefs, $name) {
        $key = $this->key($name); $value = $this->input_value($key);
        $prefs[$key] = $value;
    }
  
    // settings multi line text area
    function persist_textarea(& $prefs, $name) {
        $key = $this->key($name); $value = $this->input_value($key);
        $value = explode(PHP_EOL, $value); // array from text
        $value = array_map('trim', $value); // no spaces
        $value = array_filter($value); // no empty lines
        // sort($value); // alpha sorted
        $prefs[$key] = $value;
    }

    // settings single line text
    function persist_text(& $prefs, $name) {
        $key = $this->key($name); $value = $this->input_value($key);
        $prefs[$key] = trim($value);
    }

    // persist user settings
    function hook_preferences_save($args) {
        if ($this->is_plugin_section($args)) {
            $prefs = & $args['prefs'];
            foreach($this->settings_checkbox_list() as $name) {
                $this->persist_checkbox($prefs, $name);
            }
            foreach($this->settings_select_list() as $name) {
                $this->persist_select($prefs, $name);
            }
            foreach($this->settings_area_list() as $name) {
                $this->persist_textarea($prefs, $name);
            }
            foreach($this->settings_area_list() as $name) {
                $this->persist_textarea($prefs, $name);
            }
            foreach($this->settings_text_list() as $name) {
                $this->persist_text($prefs, $name);
            }
        }
        return $args;
    }

}

?>
