#ifndef DATA_CONTENT_JSON_X37H043Y096BT9
#define DATA_CONTENT_JSON_X37H043Y096BT9
namespace static_port_data_content
{
template <class T = std::string, class U = int>
struct json
{
  typedef T string_type;
  typedef U number_type;
  string_type _hello = "world";
  template<class V>
  void traverse(V & h)
  {
    h( "hello", _hello);
  }
};
}
#endif