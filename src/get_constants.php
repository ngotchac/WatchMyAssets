<?php

ob_start();
require($argv[1]);
ob_end_clean();

echo json_encode(get_defined_constants(true)['user']);

