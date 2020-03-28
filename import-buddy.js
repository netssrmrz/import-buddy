import fs from 'fs';
import path from 'path';

main();

async function main()
{
  const src_dir = "C:\\projects\\snsw\\forms-digitisation\\template\\web\\src";
  const import_file = "C:\\projects\\snsw\\forms-digitisation\\template\\web\\src\\common";

  await Process_Files(src_dir, import_file);
}

async function Process_Files(dir_path, import_file)
{
  const ext = ".js";
  const dir = await fs.promises.opendir(dir_path);
  for await (const entry of dir)
  {
    const file = dir_path + "\\" + entry.name;
    if (entry.isFile() && entry.name.endsWith(ext))
    {
      //if (entry.name == "index.js")
        Process_File(file, import_file);
    }
    else if (entry.isDirectory())
    {
      await Process_Files(file, import_file);
    }
  }
}

function Process_File(file, import_file)
{
  const name = path.basename(import_file, ".js");
  const file_str = fs.readFileSync(file, "utf8");

  const positions = Calc_Import_Positions(file_str, name);
  if (positions != null)
  {
    console.log("file: ", file);

    let new_import = path.relative(path.dirname(file), path.dirname(import_file));
    if (new_import == "")
    {
      new_import = ".";
    }
    new_import = new_import.replace(/\\/g, "/");
    new_import += "/" + name;
    //console.log("new_import: \"" + new_import + "\"");

    const file_strs = Split_Str(file_str, positions);
    //console.log("file_strs.length: " + file_strs.length);

    const new_file_str = Insert_Str(file_strs, new_import);
    fs.writeFileSync(file, new_file_str, "utf8");
  }
}

function Index_Of_Import(str, name, start_pos)
{
  let import_str_pos = Index_Of(str, " from '", name, start_pos);
  if (import_str_pos == null)
  {
    import_str_pos = Index_Of(str, " from \"", name, start_pos);
  }
  if (import_str_pos == null)
  {
    import_str_pos = Index_Of(str, "import '", name, start_pos);
  }
  if (import_str_pos == null)
  {
    import_str_pos = Index_Of(str, "import \"", name, start_pos);
  }

  return import_str_pos;
}

function Insert_Str(strs, new_str)
{
  let res;

  for (let i = 0; i < strs.length; i++)
  {
    const str = strs[i];
    if (i == 0)
    {
      res = str;
    }
    else
    {
      res += new_str + str;
    }
  }

  return res;
}

function Split_Str(str, positions)
{
  let prev_pos = {start: 0, end: 0};
  let strs = [];

  for (const pos of positions)
  {
    const str_segment = str.substring(prev_pos.end, pos.start);
    strs.push(str_segment);
    prev_pos = pos;
  }
  const last_pos = positions[positions.length - 1];
  const last_segment = str.substring(last_pos.end);
  strs.push(last_segment);

  if (strs.length == 0)
    strs = null;

  return strs;
}

function Calc_Import_Positions(file_str, name)
{
  let positions = [];

  let pos = Index_Of_Import(file_str, name, 0);
  while (pos != null)
  {
    positions.push(pos);
    pos = Index_Of_Import(file_str, name, pos.end);
  }

  if (positions.length == 0)
    positions = null;

  return positions;
}

function Index_Of(src, prefix, name, start_pos)
{
  let res;

  const id = prefix + name;
  const id_pos = src.indexOf(id, start_pos);
  if (id_pos != -1)
  {
    const start = id_pos + prefix.length;
    const end = start + name.length;
    res = { start, end };
  }

  return res;
}