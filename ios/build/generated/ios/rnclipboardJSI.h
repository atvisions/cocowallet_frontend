/**
 * This code was generated by [react-native-codegen](https://www.npmjs.com/package/react-native-codegen).
 *
 * Do not edit this file as changes may cause incorrect behavior and will be lost
 * once the code is regenerated.
 *
 * @generated by codegen project: GenerateModuleH.js
 */

#pragma once

#include <ReactCommon/TurboModule.h>
#include <react/bridging/Bridging.h>

namespace facebook::react {


  class JSI_EXPORT NativeClipboardModuleCxxSpecJSI : public TurboModule {
protected:
  NativeClipboardModuleCxxSpecJSI(std::shared_ptr<CallInvoker> jsInvoker);

public:
  virtual jsi::Value getString(jsi::Runtime &rt) = 0;
  virtual jsi::Value getStrings(jsi::Runtime &rt) = 0;
  virtual jsi::Value getImagePNG(jsi::Runtime &rt) = 0;
  virtual jsi::Value getImageJPG(jsi::Runtime &rt) = 0;
  virtual jsi::Value setImage(jsi::Runtime &rt, jsi::String content) = 0;
  virtual jsi::Value getImage(jsi::Runtime &rt) = 0;
  virtual void setString(jsi::Runtime &rt, jsi::String content) = 0;
  virtual void setStrings(jsi::Runtime &rt, jsi::Array content) = 0;
  virtual jsi::Value hasString(jsi::Runtime &rt) = 0;
  virtual jsi::Value hasImage(jsi::Runtime &rt) = 0;
  virtual jsi::Value hasURL(jsi::Runtime &rt) = 0;
  virtual jsi::Value hasNumber(jsi::Runtime &rt) = 0;
  virtual jsi::Value hasWebURL(jsi::Runtime &rt) = 0;
  virtual void setListener(jsi::Runtime &rt) = 0;
  virtual void removeListener(jsi::Runtime &rt) = 0;
  virtual void addListener(jsi::Runtime &rt, jsi::String eventName) = 0;
  virtual void removeListeners(jsi::Runtime &rt, int count) = 0;

};

template <typename T>
class JSI_EXPORT NativeClipboardModuleCxxSpec : public TurboModule {
public:
  jsi::Value get(jsi::Runtime &rt, const jsi::PropNameID &propName) override {
    return delegate_.get(rt, propName);
  }

  static constexpr std::string_view kModuleName = "RNCClipboard";

protected:
  NativeClipboardModuleCxxSpec(std::shared_ptr<CallInvoker> jsInvoker)
    : TurboModule(std::string{NativeClipboardModuleCxxSpec::kModuleName}, jsInvoker),
      delegate_(reinterpret_cast<T*>(this), jsInvoker) {}


private:
  class Delegate : public NativeClipboardModuleCxxSpecJSI {
  public:
    Delegate(T *instance, std::shared_ptr<CallInvoker> jsInvoker) :
      NativeClipboardModuleCxxSpecJSI(std::move(jsInvoker)), instance_(instance) {

    }

    jsi::Value getString(jsi::Runtime &rt) override {
      static_assert(
          bridging::getParameterCount(&T::getString) == 1,
          "Expected getString(...) to have 1 parameters");

      return bridging::callFromJs<jsi::Value>(
          rt, &T::getString, jsInvoker_, instance_);
    }
    jsi::Value getStrings(jsi::Runtime &rt) override {
      static_assert(
          bridging::getParameterCount(&T::getStrings) == 1,
          "Expected getStrings(...) to have 1 parameters");

      return bridging::callFromJs<jsi::Value>(
          rt, &T::getStrings, jsInvoker_, instance_);
    }
    jsi::Value getImagePNG(jsi::Runtime &rt) override {
      static_assert(
          bridging::getParameterCount(&T::getImagePNG) == 1,
          "Expected getImagePNG(...) to have 1 parameters");

      return bridging::callFromJs<jsi::Value>(
          rt, &T::getImagePNG, jsInvoker_, instance_);
    }
    jsi::Value getImageJPG(jsi::Runtime &rt) override {
      static_assert(
          bridging::getParameterCount(&T::getImageJPG) == 1,
          "Expected getImageJPG(...) to have 1 parameters");

      return bridging::callFromJs<jsi::Value>(
          rt, &T::getImageJPG, jsInvoker_, instance_);
    }
    jsi::Value setImage(jsi::Runtime &rt, jsi::String content) override {
      static_assert(
          bridging::getParameterCount(&T::setImage) == 2,
          "Expected setImage(...) to have 2 parameters");

      return bridging::callFromJs<jsi::Value>(
          rt, &T::setImage, jsInvoker_, instance_, std::move(content));
    }
    jsi::Value getImage(jsi::Runtime &rt) override {
      static_assert(
          bridging::getParameterCount(&T::getImage) == 1,
          "Expected getImage(...) to have 1 parameters");

      return bridging::callFromJs<jsi::Value>(
          rt, &T::getImage, jsInvoker_, instance_);
    }
    void setString(jsi::Runtime &rt, jsi::String content) override {
      static_assert(
          bridging::getParameterCount(&T::setString) == 2,
          "Expected setString(...) to have 2 parameters");

      return bridging::callFromJs<void>(
          rt, &T::setString, jsInvoker_, instance_, std::move(content));
    }
    void setStrings(jsi::Runtime &rt, jsi::Array content) override {
      static_assert(
          bridging::getParameterCount(&T::setStrings) == 2,
          "Expected setStrings(...) to have 2 parameters");

      return bridging::callFromJs<void>(
          rt, &T::setStrings, jsInvoker_, instance_, std::move(content));
    }
    jsi::Value hasString(jsi::Runtime &rt) override {
      static_assert(
          bridging::getParameterCount(&T::hasString) == 1,
          "Expected hasString(...) to have 1 parameters");

      return bridging::callFromJs<jsi::Value>(
          rt, &T::hasString, jsInvoker_, instance_);
    }
    jsi::Value hasImage(jsi::Runtime &rt) override {
      static_assert(
          bridging::getParameterCount(&T::hasImage) == 1,
          "Expected hasImage(...) to have 1 parameters");

      return bridging::callFromJs<jsi::Value>(
          rt, &T::hasImage, jsInvoker_, instance_);
    }
    jsi::Value hasURL(jsi::Runtime &rt) override {
      static_assert(
          bridging::getParameterCount(&T::hasURL) == 1,
          "Expected hasURL(...) to have 1 parameters");

      return bridging::callFromJs<jsi::Value>(
          rt, &T::hasURL, jsInvoker_, instance_);
    }
    jsi::Value hasNumber(jsi::Runtime &rt) override {
      static_assert(
          bridging::getParameterCount(&T::hasNumber) == 1,
          "Expected hasNumber(...) to have 1 parameters");

      return bridging::callFromJs<jsi::Value>(
          rt, &T::hasNumber, jsInvoker_, instance_);
    }
    jsi::Value hasWebURL(jsi::Runtime &rt) override {
      static_assert(
          bridging::getParameterCount(&T::hasWebURL) == 1,
          "Expected hasWebURL(...) to have 1 parameters");

      return bridging::callFromJs<jsi::Value>(
          rt, &T::hasWebURL, jsInvoker_, instance_);
    }
    void setListener(jsi::Runtime &rt) override {
      static_assert(
          bridging::getParameterCount(&T::setListener) == 1,
          "Expected setListener(...) to have 1 parameters");

      return bridging::callFromJs<void>(
          rt, &T::setListener, jsInvoker_, instance_);
    }
    void removeListener(jsi::Runtime &rt) override {
      static_assert(
          bridging::getParameterCount(&T::removeListener) == 1,
          "Expected removeListener(...) to have 1 parameters");

      return bridging::callFromJs<void>(
          rt, &T::removeListener, jsInvoker_, instance_);
    }
    void addListener(jsi::Runtime &rt, jsi::String eventName) override {
      static_assert(
          bridging::getParameterCount(&T::addListener) == 2,
          "Expected addListener(...) to have 2 parameters");

      return bridging::callFromJs<void>(
          rt, &T::addListener, jsInvoker_, instance_, std::move(eventName));
    }
    void removeListeners(jsi::Runtime &rt, int count) override {
      static_assert(
          bridging::getParameterCount(&T::removeListeners) == 2,
          "Expected removeListeners(...) to have 2 parameters");

      return bridging::callFromJs<void>(
          rt, &T::removeListeners, jsInvoker_, instance_, std::move(count));
    }

  private:
    friend class NativeClipboardModuleCxxSpec;
    T *instance_;
  };

  Delegate delegate_;
};

} // namespace facebook::react
